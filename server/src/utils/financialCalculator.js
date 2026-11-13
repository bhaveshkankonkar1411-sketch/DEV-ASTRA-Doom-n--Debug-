/**
 * Deterministic Financial Calculations for DropPilot AI
 * Strict implementation of PRD Section 10.5 & Section 3.9:
 * 
 * Total Cost = Supplier Cost + Shipping Cost + Platform Fees + Ad Spend + Other Costs
 * Estimated Profit = Selling Price - Total Cost
 * Profit Margin % = (Estimated Profit / Selling Price) * 100
 * Break-even Price = Total Cost
 */

export const calculateProductPricing = ({
  currency = 'INR',
  sellingPrice = 0,
  supplierCost = 0,
  shippingCost = 0,
  platformFees = 0,
  advertisingCostPerOrder = 0,
  otherCosts = 0,
}) => {
  const safeSellingPrice = Number(sellingPrice) || 0;
  const safeSupplierCost = Number(supplierCost) || 0;
  const safeShipping = Number(shippingCost) || 0;
  const safePlatformFees = Number(platformFees) || 0;
  const safeAdSpend = Number(advertisingCostPerOrder) || 0;
  const safeOtherCosts = Number(otherCosts) || 0;

  const totalCost = Number(
    (safeSupplierCost + safeShipping + safePlatformFees + safeAdSpend + safeOtherCosts).toFixed(2)
  );

  const estimatedProfit = Number((safeSellingPrice - totalCost).toFixed(2));

  const profitMarginPercent =
    safeSellingPrice > 0
      ? Number(((estimatedProfit / safeSellingPrice) * 100).toFixed(2))
      : 0;

  // Break-even price is the exact total cost required to cover all expenses
  const breakEvenPrice = totalCost;

  // Recommended price target based on a healthy 30% margin rule
  const target30Price =
    totalCost > 0 ? Number((totalCost / (1 - 0.3)).toFixed(2)) : safeSellingPrice;

  return {
    currency,
    totalCost,
    estimatedProfit,
    profitMarginPercent,
    calculationBasis: 'backend',
    isEstimate: true,
    breakEvenPrice,
    recommendedPrice: target30Price,
    breakdown: {
      sellingPrice: safeSellingPrice,
      supplierCost: safeSupplierCost,
      shippingCost: safeShipping,
      platformFees: safePlatformFees,
      advertisingCost: safeAdSpend,
      otherCosts: safeOtherCosts,
    },
  };
};

export const calculateProfitMetrics = calculateProductPricing;

export default {
  calculateProductPricing,
  calculateProfitMetrics,
};
