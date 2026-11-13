import config from '../../config/environment.js';
import logger from '../../utils/logger.js';
import { sanitizeInputText } from '../../validators/aiValidator.js';

/**
 * Extracts and parses JSON from Gemini's text response.
 * Handles markdown formatting, backticks, or preamble text.
 */
export const extractJsonFromText = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty response text received from Gemini');
  }

  // Remove markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find the first outer JSON object or array if extra prose is included
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace > startIndex) {
      cleaned = cleaned.substring(startIndex, lastBrace + 1);
    }
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1 && lastBracket > startIndex) {
      cleaned = cleaned.substring(startIndex, lastBracket + 1);
    }
  }

  return JSON.parse(cleaned);
};

/**
 * Call Gemini API directly via REST API or SDK
 */
async function callGeminiApi({ prompt, systemInstruction, temperature = 0.3, model }) {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment');
  }

  const selectedModel = model || config.geminiModel || 'gemini-3.5-flash-lite';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  // Use AbortController for 15s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // use raw text
      }
      const message = errorJson?.error?.message || `Gemini API returned status ${res.status}`;
      throw new Error(`[Gemini API Error ${res.status}] ${message}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini response candidate does not contain text content');
    }

    return candidateText;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Gemini API call timed out after 15 seconds');
    }
    throw err;
  }
}

/**
 * Main AI generation helper with JSON parsing, schema validation, and fallback recovery.
 */
export const generateJsonCompletion = async ({
  prompt,
  systemInstruction = '',
  schemaValidator = null,
  fallbackGenerator = null,
  temperature = 0.2,
  model = null,
}) => {
  const sanitizedPrompt = sanitizeInputText(prompt);
  const isKeyConfigured = Boolean(config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_placeholder');

  if (!isKeyConfigured) {
    logger.warn('[Gemini Client] GEMINI_API_KEY is not set or placeholder. Using safe demo fallback.');
    if (typeof fallbackGenerator === 'function') {
      const fallbackData = fallbackGenerator();
      if (schemaValidator) {
        const val = schemaValidator(fallbackData);
        return {
          success: true,
          data: val.data || fallbackData,
          source: 'demo_fallback',
          isFallback: true,
          notice: 'Generated via demo mode because GEMINI_API_KEY is not configured.',
        };
      }
      return {
        success: true,
        data: fallbackData,
        source: 'demo_fallback',
        isFallback: true,
      };
    }
    throw new Error('GEMINI_API_KEY is missing and no fallback generator was provided.');
  }

  try {
    const rawText = await callGeminiApi({
      prompt: sanitizedPrompt,
      systemInstruction,
      temperature,
      model,
    });

    const parsedJson = extractJsonFromText(rawText);

    if (typeof schemaValidator === 'function') {
      const validation = schemaValidator(parsedJson);
      if (!validation.isValid) {
        logger.warn('[Gemini Client] Response failed schema validation:', validation.errors);
        // If output was slightly malformed but fallback exists, fallback gracefully
        if (typeof fallbackGenerator === 'function') {
          logger.warn('[Gemini Client] Falling back to structured default due to validation errors.');
          const fallbackData = fallbackGenerator();
          return {
            success: true,
            data: fallbackData,
            source: 'validation_fallback',
            isFallback: true,
            validationErrors: validation.errors,
          };
        }
        throw new Error(`AI response failed validation: ${validation.errors.join(', ')}`);
      }
      return {
        success: true,
        data: validation.data,
        source: 'gemini',
        isFallback: false,
      };
    }

    return {
      success: true,
      data: parsedJson,
      source: 'gemini',
      isFallback: false,
    };
  } catch (err) {
    logger.error(`[Gemini Client] Generation failed: ${err.message}`);

    // Non-functional requirement & PRD 8.5: Fallback on API failure
    if (typeof fallbackGenerator === 'function') {
      logger.info('[Gemini Client] Utilizing safe demo fallback after API failure.');
      const fallbackData = fallbackGenerator();
      if (schemaValidator) {
        const val = schemaValidator(fallbackData);
        return {
          success: true,
          data: val.data || fallbackData,
          source: 'error_fallback',
          isFallback: true,
          errorNotice: err.message,
        };
      }
      return {
        success: true,
        data: fallbackData,
        source: 'error_fallback',
        isFallback: true,
        errorNotice: err.message,
      };
    }

    throw err;
  }
};

/**
 * Returns current Gemini status and configuration metadata
 */
export const getGeminiStatus = () => {
  return {
    configured: Boolean(config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_placeholder'),
    model: config.geminiModel || 'gemini-1.5-flash',
  };
};

export default {
  extractJsonFromText,
  generateJsonCompletion,
  getGeminiStatus,
};
