import { generateJsonCompletion } from './geminiClient.js';
import { validateProductAnalysisOutput } from '../../validators/aiValidator.js';

/**
 * Product Opportunity Analysis Service
 * Evaluates product economic feasibility without fabricating unverified demand statistics.
 * Conforms to PRD Section 10.2 and FR-003.
 */
export const analyzeProductOpportunity = async ({
  productId = 'prod_demo',
  title = '',
  category = 'General',
  suggestedRetailPrice = 0,
  estimatedCost = 0,
  description = '',
  dataSource = 'catalog',
}) => {
  const marginPaise = suggestedRetailPrice - estimatedCost;
  const marginPercent = suggestedRetailPrice > 0 ? ((marginPaise / suggestedRetailPrice) * 100).toFixed(1) : 0;

  const prompt = `
Analyze the viability and operational profile of this e-commerce dropshipping candidate based solely on supplied facts:
- Title: ${title}
- Category: ${category}
- Retail Price: ₹${(suggestedRetailPrice / 100).toFixed(2)}
- Supplier Cost: ₹${(estimatedCost / 100).toFixed(2)}
- Estimated Unit Margin: ${marginPercent}%
- Description: ${description}

DO NOT invent false trend statistics, fake search volume, or unverified claims.
Disclose known risks (e.g., return rates in category, shipping fragility, competition).

Respond in pure JSON:
{
  "opportunityScore": 75,
  "scoreLabel": "Margin-based evaluation",
  "strengths": ["Strong unit margin of ${marginPercent}%", "Clear niche category"],
  "risks": ["Market demand has not been externally verified", "Ad acquisition costs may compress net margin"],
  "recommendation": "Review sample suppliers and test initial ad creatives before bulk commitments",
  "dataSource": "${dataSource}"
}
`;

  const fallbackGenerator = () => ({
    productId,
    opportunityScore: marginPercent > 40 ? 82 : 68,
    scoreLabel: 'Calculated margin estimate',
    strengths: [
      `Healthy gross unit margin of approximately ${marginPercent}%`,
      `Popular ${category} catalogue category with high consumer appeal`,
    ],
    risks: [
      'Live external consumer demand and ad conversion rates are unverified',
      'Supplier fulfillment times must be tested to ensure low dispute rates',
    ],
    recommendation: 'Verify supplier stock levels and run a test pricing calculation before publishing.',
    dataSource,
  });

  const result = await generateJsonCompletion({
    prompt,
    systemInstruction: 'You are an e-commerce catalog risk analyst. Return pure JSON. Do not invent demand numbers.',
    schemaValidator: (data) => validateProductAnalysisOutput(data, productId),
    fallbackGenerator,
    temperature: 0.2,
  });

  return {
    ...result.data,
    productId,
    isFallback: result.isFallback,
    source: result.source,
  };
};

export default {
  analyzeProductOpportunity,
};

