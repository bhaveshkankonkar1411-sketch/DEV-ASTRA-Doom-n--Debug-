import { computeSemanticSearch } from './huggingFaceService.js';
import { generateJsonCompletion } from './geminiClient.js';
import logger from '../../utils/logger.js';
import { sanitizeInputText } from '../../validators/aiValidator.js';

/**
 * DropPilot AI - Multi-Criteria Product Opportunity Scoring Engine
 * Conforms to PRD Section 3.1, 10.2, and Multi-Model Architecture
 *
 * Combines 5 deterministic dimensions:
 * 1. Estimated Profit Margin (30%)
 * 2. Market Demand Score & Trend (25%)
 * 3. Supplier Reliability & Trust Badge (20%)
 * 4. Shipping Speed & Landed Cost (10%)
 * 5. Semantic Vector Relevance (15% if query provided)
 */

export function calculateOpportunityScore({
  product,
  similarityScore = null,
  desiredMarginPercent = 35,
}) {
  const price = Number(product.suggestedRetailPrice || product.price || 0);
  const cost = Number(product.estimatedCost || product.cost || 0);

  // 1. Margin Score (0 - 100)
  const marginPercent = price > 0 ? ((price - cost) / price) * 100 : 0;
  let marginScore = 0;
  if (marginPercent >= 50) marginScore = 100;
  else if (marginPercent <= 0) marginScore = 0;
  else marginScore = Math.min(100, Math.round((marginPercent / desiredMarginPercent) * 80));

  // 2. Demand Score (0 - 100)
  const baseDemand = Number(product.demandScore || product.score || 70);
  let trendBoost = 0;
  if (product.trendVelocity === 'RISING') trendBoost = 10;
  else if (product.trendVelocity === 'FALLING') trendBoost = -15;
  const demandScore = Math.min(100, Math.max(0, baseDemand + trendBoost));

  // 3. Supplier Reliability Score (0 - 100)
  const suppliers = product.suppliers || [];
  let bestSupplierScore = 65; // standard fallback
  let isVerified = false;
  let shippingDays = 7;

  if (suppliers.length > 0) {
    suppliers.forEach((s) => {
      const sTrust = Number(s.trustScore || 70);
      const sFulfillment = Number(s.fulfillmentRate || 95);
      const sBadge = s.trustBadge || '';
      const sDays = Number(s.shippingDaysMax || s.estimatedShippingDays || 8);

      let score = Math.round((sTrust * 0.6) + (sFulfillment * 0.4));
      if (sBadge === 'VERIFIED') {
        score = Math.min(100, score + 10);
        isVerified = true;
      } else if (sBadge === 'TOP_RATED') {
        score = Math.min(95, score + 5);
      }

      if (score > bestSupplierScore) {
        bestSupplierScore = score;
        shippingDays = sDays;
      }
    });
  } else {
    // If supplier badge exists on product directly
    if (product.sourceLabel === 'VERIFIED_PARTNER') {
      bestSupplierScore = 92;
      isVerified = true;
    }
  }

  // 4. Shipping Speed Score (0 - 100)
  let shippingScore = 70;
  if (shippingDays <= 3) shippingScore = 100;
  else if (shippingDays <= 6) shippingScore = 85;
  else if (shippingDays <= 10) shippingScore = 70;
  else if (shippingDays <= 15) shippingScore = 50;
  else shippingScore = 30;

  // 5. Semantic Vector Relevance (0 - 100)
  const hasSemantic = similarityScore !== null && Number.isFinite(similarityScore);
  const semanticScore = hasSemantic ? Math.min(100, Math.max(0, similarityScore)) : 0;

  // Deterministic Weighting
  const marginWeight = hasSemantic ? 0.30 : 0.35;
  const demandWeight = hasSemantic ? 0.25 : 0.30;
  const supplierWeight = hasSemantic ? 0.20 : 0.25;
  const shippingWeight = 0.10;
  const semanticWeight = hasSemantic ? 0.15 : 0;

  const marginContribution = Math.round(marginScore * marginWeight);
  const demandContribution = Math.round(demandScore * demandWeight);
  const supplierContribution = Math.round(bestSupplierScore * supplierWeight);
  const shippingContribution = Math.round(shippingScore * shippingWeight);
  const semanticContribution = Math.round(semanticScore * semanticWeight);

  const totalScore = marginContribution + demandContribution + supplierContribution + shippingContribution + semanticContribution;

  return {
    opportunityScore: Math.min(100, Math.max(0, totalScore)),
    dimensions: {
      marginScore,
      marginPercent: Number(marginPercent.toFixed(1)),
      demandScore,
      trendVelocity: product.trendVelocity || 'STABLE',
      supplierScore: bestSupplierScore,
      isVerifiedSupplier: isVerified,
      shippingScore,
      shippingDays,
      semanticScore: hasSemantic ? semanticScore : null,
    },
    scoreBreakdown: {
      marginContribution,
      demandContribution,
      supplierContribution,
      shippingContribution,
      semanticContribution,
    },
    recommendationReason: `${product.title || product.name} offers ${marginPercent.toFixed(0)}% margin with ${product.trendVelocity || 'stable'} demand and ${bestSupplierScore}/100 supplier reliability.`,
  };
}

/**
 * Generate Gemini Strategic Explanation for the Top Recommendation
 * Strictly grounded in pre-calculated metrics; AI does NOT invent numbers.
 */
export async function explainRecommendationWithGemini({
  product,
  opportunityData,
}) {
  const pName = product.title || product.name;
  const { opportunityScore, dimensions } = opportunityData;

  const prompt = `
You are a strategic dropshipping product analyst. Provide a brief, grounded explanation for why this product was recommended by our multi-criteria algorithm.
Do NOT invent financial figures or recalculate scores. Ground your reasoning strictly in these verified metrics:

Product: ${pName} (${product.category})
Price: ₹${product.suggestedRetailPrice || product.price} | Cost: ₹${product.estimatedCost || product.cost}
Estimated Profit Margin: ${dimensions.marginPercent}%
Overall Opportunity Score: ${opportunityScore} / 100
Market Demand: ${dimensions.demandScore} / 100 (Trend: ${dimensions.trendVelocity})
Supplier Reliability: ${dimensions.supplierScore} / 100 (Verified Partner: ${dimensions.isVerifiedSupplier ? 'Yes' : 'No'})
Estimated Shipping Speed: ~${dimensions.shippingDays} days

Return pure JSON conforming to this schema:
{
  "recommendationHeadline": "Punchy 1-sentence value proposition",
  "explanation": "2-3 sentences explaining why the margin and demand make this an actionable dropshipping opportunity",
  "keyStrengths": [
    "Concrete strength citing margin or demand figure",
    "Concrete strength citing supplier or trend"
  ],
  "actionTip": "Practical testing or marketing recommendation"
}
`;

  const systemInstruction = 'You are an e-commerce intelligence copilot. Return pure JSON. Never promise guaranteed sales. Reference supplied figures only.';

  const fallbackGenerator = () => ({
    recommendationHeadline: `${pName} combines strong ${dimensions.marginPercent}% margin with ${dimensions.trendVelocity.toLowerCase()} market demand.`,
    explanation: `Scoring ${opportunityScore}/100 across unit economics and demand indicators, this product provides sufficient margin buffer to absorb customer acquisition costs while maintaining profitability.`,
    keyStrengths: [
      `Healthy ${dimensions.marginPercent}% margin allows flexible paid ad spend`,
      `${dimensions.isVerifiedSupplier ? 'Backed by audited verified suppliers' : 'Reliable supplier fulfillment'} with ~${dimensions.shippingDays} day delivery`,
    ],
    actionTip: 'Validate with 2-3 short video creatives targeting core audience before bulk listing.',
  });

  try {
    const result = await generateJsonCompletion({
      prompt: sanitizeInputText(prompt),
      systemInstruction,
      fallbackGenerator,
      temperature: 0.3,
    });

    return {
      ...result.data,
      isFallback: result.isFallback,
      source: result.source,
    };
  } catch (err) {
    logger.warn('[Recommendation Service] Gemini explanation fallback:', err.message);
    return {
      ...fallbackGenerator(),
      isFallback: true,
      source: 'error_fallback',
    };
  }
}

/**
 * Score and Rank All Candidates via Multi-Criteria Engine
 */
export async function rankProductsByOpportunity({
  products = [],
  query = '',
  includeAiExplanation = true,
}) {
  if (!products || products.length === 0) return [];

  let scoredCandidates = [];

  if (query && query.trim()) {
    // If a semantic query is provided, compute dense embeddings first
    const semanticResults = await computeSemanticSearch(query, products);
    scoredCandidates = semanticResults.map((sr) => {
      const scoring = calculateOpportunityScore({
        product: sr.product,
        similarityScore: sr.similarityScore,
      });
      return {
        product: sr.product,
        ...scoring,
        similarityScore: sr.similarityScore,
        model: sr.model,
      };
    });
  } else {
    // Browsing mode without query
    scoredCandidates = products.map((p) => {
      const scoring = calculateOpportunityScore({ product: p });
      return {
        product: p,
        ...scoring,
        similarityScore: null,
      };
    });
  }

  // Sort by Opportunity Score descending
  scoredCandidates.sort((a, b) => b.opportunityScore - a.opportunityScore);

  // If requested, generate Gemini strategic explanation for the #1 top opportunity
  if (includeAiExplanation && scoredCandidates.length > 0) {
    const topCandidate = scoredCandidates[0];
    const explanation = await explainRecommendationWithGemini({
      product: topCandidate.product,
      opportunityData: topCandidate,
    });
    topCandidate.aiExplanation = explanation;
  }

  return scoredCandidates;
}

export default {
  calculateOpportunityScore,
  explainRecommendationWithGemini,
  rankProductsByOpportunity,
};
