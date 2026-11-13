import config from '../../config/environment.js';

// Google Gemini API client placeholder
export const getGeminiClient = () => {
  if (!config.geminiApiKey) {
    console.warn('[Gemini Client] GEMINI_API_KEY is not configured.');
  }
  return {
    apiKey: config.geminiApiKey,
  };
};

export default getGeminiClient;

