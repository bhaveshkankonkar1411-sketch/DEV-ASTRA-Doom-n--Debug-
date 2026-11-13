import { generateJsonCompletion } from './geminiClient.js';
import { validateMarketingContentOutput } from '../../validators/aiValidator.js';

/**
 * Social Media & Multi-Platform Promotional Content Generator
 * Conforms to PRD Section 3.8 and Section 10.3
 */
export const generateMarketingContent = async ({
  productId = null,
  productTitle = '',
  name = '',
  productDetails = {},
  sellingPoints = [],
  features = [],
  targetAudience = 'General shoppers',
  tone = 'energetic',
  platform = 'all',
}) => {
  const effectiveTitle = productTitle || name || productDetails.name || 'Featured Product';
  const rawPoints = (sellingPoints && sellingPoints.length > 0)
    ? sellingPoints
    : (features && features.length > 0 ? features : (productDetails.features || []));
  const effectivePoints = Array.isArray(rawPoints) && rawPoints.length > 0
    ? rawPoints
    : ['Durable design', 'Modern aesthetic', 'Great value'];

  const prompt = `
Create viral, platform-adapted marketing copy for an e-commerce product based strictly on these details:
Product: ${effectiveTitle}
Key Selling Points: ${JSON.stringify(effectivePoints)}
Target Audience: ${targetAudience}
Tone: ${tone}
Requested Platform Focus: ${platform}

Return pure JSON matching this exact structure:
{
  "tiktokHook": "A punchy first 3-second hook for a TikTok video",
  "instagramCaption": "Engaging caption with line breaks, emojis, and 5-8 relevant hashtags",
  "adScript": "Hook: ... Problem: ... Solution: ... Call To Action: ...",
  "shopifySeo": {
    "metaTitle": "SEO title under 60 chars",
    "metaDescription": "SEO description under 155 chars",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}
`;

  const systemInstruction = 'You are a viral social media marketing copywriter. Return strict JSON. Do not promise medical cures, guaranteed conversions, or financial gains. Ground copy exclusively in provided features.';

  const fallbackGenerator = () => ({
    tiktokHook: `Stop scrolling if you need a better way to handle ${effectiveTitle}!`,
    instagramCaption: `Level up your daily essentials with our top trending pick: ${effectiveTitle} ✨ Designed for everyday convenience and built to last. Tap the link in bio to shop yours today! 🛍️\n\n#dropshipping #lifestyle #musthaves #trendingnow #dailydiscoveries`,
    adScript: `[0-3s] Hook: Still struggling to find a reliable ${effectiveTitle}?\n[3-8s] Problem: Most alternatives wear out or feel outdated.\n[8-15s] Solution: This solves that with premium craft and sleek styling.\n[15-20s] CTA: Claim yours now while stocks last!`,
    shopifySeo: {
      metaTitle: `${effectiveTitle} - Trending Must-Have`,
      metaDescription: `Discover the all-new ${effectiveTitle}. High durability, exceptional design, and fast shipping.`,
      keywords: [effectiveTitle.toLowerCase(), 'trending', 'deals', 'lifestyle'],
    },
  });

  const result = await generateJsonCompletion({
    prompt,
    systemInstruction,
    schemaValidator: validateMarketingContentOutput,
    fallbackGenerator,
    temperature: 0.4,
  });

  return {
    ...result.data,
    facebook: {
      headline: `${effectiveTitle} - Trending Must-Have`,
      primaryText: result.data.adScript,
    },
    tiktok: {
      hook: result.data.tiktokHook,
      script: result.data.adScript,
    },
    instagram: {
      caption: result.data.instagramCaption,
    },
    productId,
    isFallback: result.isFallback,
    source: result.source,
  };
};

export default {
  generateMarketingContent,
};
