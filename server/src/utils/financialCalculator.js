/**
 * Deterministic Financial Calculations for DropPilot AI
 * Follows accounting formulas defined in PRD Section 3.9.1:
 * - Gross Revenue = Units Sold * Selling Price
 * - COGS = Units Sold * Supplier Cost Per Unit
 * - Total Shipping = Units Sold * Shipping Cost Per Unit
 * - Gross Profit = Gross Revenue - COGS - Total Shipping
 * - Total Platform Fees = Gross Revenue * Platform Fee %
 * - Net Profit = Gross Profit - Total Platform Fees - Ad Spend - Misc Overhead
 * - Net Margin % = (Net Profit / Gross Revenue) * 100
 */

export const calculateProfitMetrics = ({
  sellingPrice = 0,
  supplierCost = 0,
  shippingCost = 0,
  adSpendPerUnit = 0,
  platformFeeRate = 0.029, // Default standard payment/platform processing fee
  unitsSold = 1,
}) => {
  const revenue = unitsSold * sellingPrice;
  const cogs = unitsSold * supplierCost;
  const shipping = unitsSold * shippingCost;
  const platformFees = revenue * platformFeeRate;
  const totalAdSpend = unitsSold * adSpendPerUnit;

  const totalCost = cogs + shipping + platformFees + totalAdSpend;
  const netProfit = revenue - totalCost;
  const marginPercentage = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue: Number(revenue.toFixed(2)),
    cogs: Number(cogs.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    platformFees: Number(platformFees.toFixed(2)),
    adSpend: Number(totalAdSpend.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    marginPercentage: Number(marginPercentage.toFixed(2)),
  };
};

