import { generateJsonCompletion } from './geminiClient.js';
import { validateRecoveryAdviceOutput } from '../../validators/aiValidator.js';

/**
 * Goal Recovery Assistant & Profit Explanation Service
 * Explains performance and provides data-grounded tactical recommendations.
 * Conforms to PRD Section 3.9, 8.2, and 10.9.
 *
 * NOTE: All monetary and financial calculations must be performed on the backend
 * prior to calling this service. The AI only interprets pre-calculated metrics.
 */
export const generateRecoveryAdvice = async ({
  question = 'Why am I behind my monthly profit target?',
  goalMetrics = {},
  financials = {},
  productPerformance = [],
  dataSource = 'csv_import',
}) => {
  const target = goalMetrics.target || goalMetrics.monthlyNetProfitTarget || 0;
  const currentNetProfit = goalMetrics.currentNetProfit != null ? goalMetrics.currentNetProfit : 0;
  const remainingProfit = goalMetrics.remainingProfit != null ? goalMetrics.remainingProfit : Math.max(0, target - currentNetProfit);
  const progressPercent = goalMetrics.progressPercent != null ? goalMetrics.progressPercent : (target > 0 ? (currentNetProfit / target) * 100 : 0);

  const toRupees = (val) => {
    const n = Number(val) || 0;
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const prompt = `
You are a strategic dropshipping financial analyst. Analyze these pre-calculated business figures and answer the user's question.
IMPORTANT: You MUST NOT recalculate financial figures or invent numbers. Base your reasoning entirely on the figures below. If data is missing (such as ad breakdown or supplier costs), explicitly state that limitation.

Verified Store Financials:
- Monthly Target: ₹${toRupees(target)}
- Current Net Profit: ₹${toRupees(currentNetProfit)}
- Remaining Amount: ₹${toRupees(remainingProfit)}
- Progress: ${progressPercent.toFixed(1)}%
- Total Revenue: ₹${toRupees(financials.revenue || 0)}
- Supplier Costs: ₹${toRupees(financials.supplierCosts || 0)}
- Ad Spend: ₹${toRupees(financials.advertisingCosts || 0)}
- Shipping Costs: ₹${toRupees(financials.shippingCosts || 0)}
- Other Expenses: ₹${toRupees(financials.otherExpenses || 0)}
- Product Summary: ${JSON.stringify(productPerformance.slice(0, 5))}
- Data Source: ${dataSource}

User Question: "${question}"

Respond with pure JSON conforming to this schema:
{
  "answer": "Clear, direct explanation referencing the verified figures above",
  "possibleReasons": [
    {
      "reason": "Specific identified financial drain or pacing factor",
      "evidence": "Concrete metric reference from the figures provided"
    }
  ],
  "suggestedActions": [
    {
      "action": "Actionable step to test or adjust",
      "expectedImpact": "Realistic operational expectation",
      "confidence": "high" // or "medium" or "low"
    }
  ],
  "limitations": [
    "Disclose any missing comparison period or unverified expense details"
  ]
}
`;

  const systemInstruction = 'You are a financial advisor for dropshippers. Return pure JSON. Never promise guaranteed profits. Reference supplied figures only.';

  const fallbackGenerator = () => ({
    answer: progressPercent < 100
      ? `You are currently at ${progressPercent.toFixed(1)}% of your monthly net profit target with ₹${toRupees(remainingProfit)} remaining. Primary cost allocations indicate supplier and advertising expenses are compressing margins.`
      : `Congratulations! You have reached ${progressPercent.toFixed(1)}% of your monthly profit goal.`,
    possibleReasons: [
      {
        reason: 'Advertising and acquisition cost ratio',
        evidence: `Ad expenses account for a significant share of revenue (${financials.revenue > 0 ? (((financials.advertisingCosts || 0) / financials.revenue) * 100).toFixed(1) : 0}%).`,
      },
      {
        reason: 'Supplier cost allocation',
        evidence: `Supplier costs represent ₹${toRupees(financials.supplierCosts || 0)} of operating spend.`,
      },
    ],
    suggestedActions: [
      {
        action: 'Audit ad campaigns and pause ad sets with negative return on ad spend (ROAS)',
        expectedImpact: 'Immediate reduction in wasted marketing spend',
        confidence: 'high',
      },
      {
        action: 'Test a 5-10% price increase on consistent bestsellers to improve per-unit profit margin',
        expectedImpact: 'Increases net contribution per order without substantial drop in volume',
        confidence: 'medium',
      },
      {
        action: 'Request volume tier pricing or evaluate alternative verified suppliers',
        expectedImpact: 'Potential 5-12% decrease in cost of goods sold',
        confidence: 'medium',
      },
    ],
    limitations: [
      'Comparative period data was not provided; cannot verify if ad costs increased relative to last month.',
      'Analysis is grounded only in the imported dataset.',
    ],
  });

  const result = await generateJsonCompletion({
    prompt,
    systemInstruction,
    schemaValidator: validateRecoveryAdviceOutput,
    fallbackGenerator,
    temperature: 0.2,
  });

  return {
    ...result.data,
    isFallback: result.isFallback,
    source: result.source,
  };
};

export default {
  generateRecoveryAdvice,
};
