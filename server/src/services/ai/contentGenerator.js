import { getGeminiClient } from './geminiClient.js';

// Social media promotional copy generator placeholder
export const generateMarketingContent = async ({ productTitle, sellingPoints }) => {
  return {
    tiktokHook: `Stop scrolling if you need a better way to handle ${productTitle}!`,
    instagramCaption: `Upgrade your daily routine with our new favorite: ${productTitle}. Link in bio to shop! ✨ #trending #dropshipping`,
    adScript: `Hook: Still struggling with this problem? Solution: Meet ${productTitle}. CTA: Order today for fast shipping!`,
  };
};

export default {
  generateMarketingContent,
};

