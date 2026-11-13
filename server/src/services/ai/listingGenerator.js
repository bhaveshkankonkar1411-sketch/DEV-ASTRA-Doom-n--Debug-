import { generateJsonCompletion } from './geminiClient.js';
import { validateListingOutput } from '../../validators/aiValidator.js';

/**
 * AI Product Listing Generator Service
 * Generates structured product listing copy strictly grounded in provided facts.
 * Conforms to PRD Section 3.3 and FR-004.
 */
export const generateProductListing = async ({
  productId = null,
  productTitle = '',
  name = '',
  productDetails = {},
  features = [],
  specifications = {},
  targetAudience = 'Everyday consumers',
  tone = 'professional',
}) => {
  const effectiveTitle = productTitle || name || productDetails.name || 'Wireless Product';
  const effectiveFeatures = features.length > 0 ? features : (productDetails.features || ['Ergonomic build', 'High durability']);
  const effectiveSpecs = Object.keys(specifications).length > 0 ? specifications : (productDetails.specifications || {});

  const prompt = `
You are an expert e-commerce copywriter. Generate a high-converting, professional dropshipping product listing based STRICTLY on the facts provided below.
DO NOT fabricate or invent certifications, battery capacities, false ratings, or unsupported medical or technical claims.

Product Facts:
- Title: ${effectiveTitle}
- Key Features: ${JSON.stringify(effectiveFeatures)}
- Specifications: ${JSON.stringify(effectiveSpecs)}
- Tone: ${tone}
- Target Audience: ${targetAudience}

Respond ONLY with valid JSON matching this schema:
{
  "title": "Clean, attractive product title",
  "description": "Engaging, formatted product description highlighting real benefits",
  "keyFeatures": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
  "seoTitle": "Under 60 character SEO optimized title",
  "seoDescription": "Under 160 character meta description",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "generatedBy": "gemini",
  "status": "draft"
}
`;

  const systemInstruction = 'You are an e-commerce catalog assistant. Always return pure JSON. Ground your copy exclusively in provided product facts.';

  const fallbackGenerator = () => ({
    title: `Premium ${effectiveTitle}`,
    description: `Experience exceptional convenience with the ${effectiveTitle}. Engineered to deliver performance and everyday comfort.`,
    keyFeatures: effectiveFeatures.length > 0 ? effectiveFeatures : ['High quality finish', 'Lightweight and durable', 'Fast fulfillment'],
    seoTitle: `${effectiveTitle} | Top Quality Deals`,
    seoDescription: `Upgrade your lifestyle with the ${effectiveTitle}. Exceptional design, reliable quality, and rapid delivery.`,
    keywords: [effectiveTitle.toLowerCase(), 'e-commerce', 'trending', 'online deals'],
    generatedBy: 'gemini',
    status: 'draft',
  });

  const result = await generateJsonCompletion({
    prompt,
    systemInstruction,
    schemaValidator: (data) => validateListingOutput(data, { productId }),
    fallbackGenerator,
    temperature: 0.3,
  });

  return {
    ...result.data,
    productId,
    isFallback: result.isFallback,
    source: result.source,
  };
};

export default {
  generateProductListing,
};
