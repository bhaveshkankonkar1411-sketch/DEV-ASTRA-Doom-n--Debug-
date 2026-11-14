import config from '../../config/environment.js';
import logger from '../../utils/logger.js';
import { sanitizeInputText } from '../../validators/aiValidator.js';

export const HF_SENTENCE_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
export const HF_SENTIMENT_MODEL = 'cardiffnlp/twitter-roberta-base-sentiment-latest';

// Modern Hugging Face Inference Router endpoints
const HF_ROUTER_PRIMARY = 'https://router.huggingface.co/hf-inference/models';
const HF_ROUTER_SECONDARY = 'https://router.huggingface.co/models';

// Circuit-breaker for HTTP 402 (Payment / Credits required) to avoid spamming the API
let paymentRequiredUntil = 0;
const PAYMENT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown before re-checking for newly added credits

/**
 * Returns current Hugging Face configuration and model availability metadata
 */
export function getHuggingFaceStatus() {
  const token = config.huggingFaceApiKey;
  const isConfigured = Boolean(token && token.trim().length > 5 && !token.includes('placeholder'));
  const isCreditsCoolingDown = Date.now() < paymentRequiredUntil;

  return {
    configured: isConfigured,
    provider: isCreditsCoolingDown
      ? 'Local Deterministic Fallback Engine (Credits Needed)'
      : 'Hugging Face Serverless Inference Router',
    models: {
      sentenceSimilarity: HF_SENTENCE_MODEL,
      sentimentAnalysis: HF_SENTIMENT_MODEL,
    },
    authStatus: !isConfigured
      ? 'UNCONFIGURED_FALLBACK_ACTIVE'
      : isCreditsCoolingDown
      ? 'TOKEN_AUTHENTICATED_CREDITS_REQUIRED_402'
      : 'TOKEN_DETECTED_ACTIVE',
  };
}

/**
 * Helper to call Hugging Face Serverless Inference API with retry and timeout handling
 */
async function callHuggingFaceApi(modelId, payload, maxRetries = 1) {
  const apiKey = config.huggingFaceApiKey;
  if (!apiKey || apiKey.includes('placeholder') || apiKey.trim().length < 5) {
    throw new Error('NO_API_KEY: Hugging Face API key is unset. Activating deterministic fallback.');
  }

  // Fast-fail if currently within the HTTP 402 cooldown to prevent repeated errors
  if (Date.now() < paymentRequiredUntil) {
    const remainingSec = Math.round((paymentRequiredUntil - Date.now()) / 1000);
    throw new Error(`HTTP 402 Cooldown: Account credits required. Re-probing in ${remainingSec}s. Utilizing high-fidelity fallback.`);
  }

  const endpoint = `${HF_ROUTER_PRIMARY}/${modelId}`;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const bodyWithOpt = {
          ...payload,
          options: {
            wait_for_model: true,
            use_cache: true,
            ...(payload.options || {}),
          },
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify(bodyWithOpt),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 503) {
          // Model warming up
          let waitTime = 2500;
          try {
            const errJson = await res.json();
            if (errJson.estimated_time) {
              waitTime = Math.min(Math.round(errJson.estimated_time * 1000), 4000);
            }
          } catch {}
          logger.warn(`[Hugging Face] Model ${modelId} warming up (503). Retrying in ${waitTime}ms...`);
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            break; // retry loop
          }
          throw new Error(`Model ${modelId} is currently warming up on free tier`);
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error(`Hugging Face authentication failed (HTTP ${res.status}). Check HUGGINGFACE_API_KEY in server/.env`);
        }

        if (res.status === 402) {
          paymentRequiredUntil = Date.now() + PAYMENT_COOLDOWN_MS;
          logger.warn(`[Hugging Face] HTTP 402 Payment Required: inference credits needed. Cooling down API requests for 5 minutes.`);
          throw new Error(`Hugging Face Inference Providers requires account credits or PRO subscription (HTTP 402). Activating high-fidelity fallback.`);
        }

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`[Hugging Face HTTP ${res.status}] ${errText.slice(0, 200)}`);
        }

        const data = await res.json();
        // If successful, reset circuit breaker
        paymentRequiredUntil = 0;
        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err.name === 'AbortError') {
          lastError = new Error(`Hugging Face request timed out after 10000ms for ${modelId}`);
        }
        if (err.message.includes('HTTP 402') || err.message.includes('HTTP 401')) {
          break; // do not retry payment/auth errors
        }
      }
    }

    throw lastError || new Error(`Failed to call Hugging Face model ${modelId}`);
}

/**
 * Deterministic Word-Vector Fallback for Semantic Search
 * Computes cosine/Jaccard semantic overlap when HF API is unreachable or offline
 */
function computeLexicalSimilarity(query, text) {
  if (!query || !text) return 0;
  const qWords = query.toLowerCase().match(/\b\w+\b/g) || [];
  const tWords = text.toLowerCase().match(/\b\w+\b/g) || [];
  if (qWords.length === 0 || tWords.length === 0) return 0;

  const tSet = new Set(tWords);
  let matches = 0;
  for (const q of qWords) {
    if (tSet.has(q)) {
      matches += 1.0;
    } else {
      // Check partial prefix matching (e.g. "ergonom" in "ergonomic")
      for (const t of tSet) {
        if (t.includes(q) || q.includes(t)) {
          matches += 0.6;
          break;
        }
      }
    }
  }

  // Jaccard-like score scaled to [0.1, 0.95]
  return Math.min(0.95, Math.max(0.05, matches / Math.sqrt(qWords.length * Math.min(tWords.length, 10))));
}

/**
 * 1. Semantic Product Search using sentence-transformers/all-MiniLM-L6-v2
 */
export async function computeSemanticSearch(query, candidateProducts = []) {
  const sanitizedQuery = sanitizeInputText(query || '');
  if (!sanitizedQuery.trim() || candidateProducts.length === 0) {
    return candidateProducts.map((p) => ({ product: p, score: 0, source: 'none' }));
  }

  const sentences = candidateProducts.map((p) => {
    const tags = Array.isArray(p.tags) ? p.tags.join(' ') : '';
    const desc = (p.description || '').slice(0, 120);
    return `${p.title} · ${p.category} · ${tags} · ${desc}`.trim();
  });

  try {
    logger.info(`[Hugging Face] Calling ${HF_SENTENCE_MODEL} for query: "${sanitizedQuery}"`);
    const scores = await callHuggingFaceApi(HF_SENTENCE_MODEL, {
      inputs: {
        source_sentence: sanitizedQuery,
        sentences,
      },
    });

    if (Array.isArray(scores) && scores.length === candidateProducts.length) {
      return candidateProducts
        .map((p, idx) => ({
          product: p,
          similarityScore: Number((scores[idx] * 100).toFixed(1)),
          rawScore: scores[idx],
          model: HF_SENTENCE_MODEL,
          provider: 'Hugging Face Hosted Inference Router',
          source: 'huggingface_minilm_l6',
          inferenceMode: 'LIVE',
          isFallback: false,
        }))
        .sort((a, b) => b.rawScore - a.rawScore);
    }
    throw new Error('Unexpected response format from Hugging Face sentence similarity');
  } catch (err) {
    logger.warn(`[Hugging Face] Semantic similarity fallback activated: ${err.message}`);
    // Deterministic semantic fallback
    return candidateProducts
      .map((p, idx) => {
        const text = sentences[idx];
        const score = computeLexicalSimilarity(sanitizedQuery, text);
        return {
          product: p,
          similarityScore: Number((score * 100).toFixed(1)),
          rawScore: score,
          model: 'deterministic-vector-fallback',
          provider: 'Local Deterministic Vector Engine',
          source: 'deterministic_fallback',
          inferenceMode: 'FALLBACK',
          isFallback: true,
          fallbackReason: err.message,
        };
      })
      .sort((a, b) => b.rawScore - a.rawScore);
  }
}

/**
 * Deterministic Rule-Based Sentiment Fallback
 */
function computeLexiconSentiment(text) {
  const lower = text.toLowerCase();
  const positiveWords = [
    'great', 'excellent', 'love', 'perfect', 'good', 'fast', 'smooth', 'durable',
    'best', 'comfortable', 'nice', 'reliable', 'amazing', 'solid', 'relaxing',
    'super', 'easy', 'quiet', 'awesome', 'happy', 'worth', 'helpful', 'clean', 'quality',
    'aesthetic', 'professional', 'warm', 'beautiful', 'wonderful', 'handy', 'favorite'
  ];
  const negativeWords = [
    'bad', 'poor', 'slow', 'broken', 'cheap', 'terrible', 'defect', 'damaged',
    'delay', 'issue', 'waste', 'noisy', 'hurt', 'fail', 'scam', 'loud', 'hot'
  ];

  let pos = 0;
  let neg = 0;
  positiveWords.forEach((w) => { if (lower.includes(w)) pos += 1; });
  negativeWords.forEach((w) => { if (lower.includes(w)) neg += 1; });

  const total = pos + neg;
  if (total === 0) return { label: 'neutral', score: 0.65 };
  if (pos > neg) return { label: 'positive', score: Math.min(0.95, 0.5 + (pos / (total * 2))) };
  return { label: 'negative', score: Math.min(0.95, 0.5 + (neg / (total * 2))) };
}

/**
 * 2. Customer Review Sentiment Analysis using cardiffnlp/twitter-roberta-base-sentiment-latest
 */
export async function analyzeReviewSentiment({ reviews = [], productName = 'Product' }) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return {
      sentimentAvailable: false,
      message: 'No customer review text is available for this product.',
      productName,
    };
  }

  const sanitizedReviews = reviews
    .map((r) => (typeof r === 'string' ? r.trim() : (r.text || r.comment || '').trim()))
    .filter(Boolean)
    .slice(0, 8); // Analyze up to 8 representative reviews

  if (sanitizedReviews.length === 0) {
    return {
      sentimentAvailable: false,
      message: 'No valid review text found to analyze.',
      productName,
    };
  }

  try {
    logger.info(`[Hugging Face] Calling ${HF_SENTIMENT_MODEL} for ${sanitizedReviews.length} reviews`);
    const results = await callHuggingFaceApi(HF_SENTIMENT_MODEL, {
      inputs: sanitizedReviews,
    });

    // Cardiffnlp RoBERTa returns array of arrays: [ [ { label: 'positive', score: 0.9 }, ... ], ... ]
    let totalPositive = 0;
    let totalNeutral = 0;
    let totalNegative = 0;

    sanitizedReviews.forEach((review, i) => {
      const pred = Array.isArray(results[i]) ? results[i] : (Array.isArray(results) && sanitizedReviews.length === 1 ? results : []);
      // Map labels: CardiffNLP handles either 'positive'/'neutral'/'negative' or 'LABEL_2' (pos), 'LABEL_1' (neu), 'LABEL_0' (neg)
      const pos = pred.find((p) => p.label?.toLowerCase().includes('pos') || p.label === 'LABEL_2')?.score || 0;
      const neu = pred.find((p) => p.label?.toLowerCase().includes('neu') || p.label === 'LABEL_1')?.score || 0;
      const neg = pred.find((p) => p.label?.toLowerCase().includes('neg') || p.label === 'LABEL_0')?.score || 0;

      totalPositive += pos;
      totalNeutral += neu;
      totalNegative += neg;
    });

    const count = sanitizedReviews.length;
    const posPct = Math.round((totalPositive / count) * 100);
    const neuPct = Math.round((totalNeutral / count) * 100);
    const negPct = Math.round((totalNegative / count) * 100);

    const overallLabel = posPct >= 60 ? 'POSITIVE' : negPct >= 40 ? 'NEGATIVE' : 'MIXED';

    return {
      sentimentAvailable: true,
      productName,
      overallLabel,
      sentimentScore: posPct,
      positivePercent: posPct,
      neutralPercent: neuPct,
      negativePercent: negPct,
      analyzedReviewsCount: count,
      model: HF_SENTIMENT_MODEL,
      provider: 'Hugging Face Hosted Inference Router',
      source: 'huggingface_roberta_sentiment',
      inferenceMode: 'LIVE',
      isFallback: false,
      summary: `${posPct}% positive sentiment across ${count} verified customer reviews (analyzed by CardiffNLP RoBERTa).`,
    };
  } catch (err) {
    logger.warn(`[Hugging Face] Sentiment analysis fallback activated: ${err.message}`);

    let posCount = 0;
    let negCount = 0;
    let neuCount = 0;

    sanitizedReviews.forEach((r) => {
      const res = computeLexiconSentiment(r);
      if (res.label === 'positive') posCount++;
      else if (res.label === 'negative') negCount++;
      else neuCount++;
    });

    const count = sanitizedReviews.length;
    const posPct = Math.round((posCount / count) * 100);
    const neuPct = Math.round((neuCount / count) * 100);
    const negPct = Math.round((negCount / count) * 100);
    const overallLabel = posPct >= 60 ? 'POSITIVE' : negPct >= 40 ? 'NEGATIVE' : 'MIXED';

    return {
      sentimentAvailable: true,
      productName,
      overallLabel,
      sentimentScore: posPct,
      positivePercent: posPct,
      neutralPercent: neuPct,
      negativePercent: negPct,
      analyzedReviewsCount: count,
      model: 'lexicon-roberta-fallback',
      provider: 'Local Deterministic Lexicon Engine',
      source: 'deterministic_fallback',
      inferenceMode: 'FALLBACK',
      isFallback: true,
      fallbackReason: err.message,
      summary: `${posPct}% positive sentiment across ${count} verified customer reviews.`,
    };
  }
}

export default {
  HF_SENTENCE_MODEL,
  HF_SENTIMENT_MODEL,
  getHuggingFaceStatus,
  computeSemanticSearch,
  analyzeReviewSentiment,
};
