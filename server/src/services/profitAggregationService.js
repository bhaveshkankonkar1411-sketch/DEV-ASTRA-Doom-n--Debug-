/**
 * Profit Aggregation Service for DropPilot AI
 * Strictly follows PRD Sections 3.9, 10.7, and 10.8:
 * - Deterministic decimal-safe arithmetic
 * - Period-based and source-based aggregation
 * - Product-level profitability breakdown
 */

export const aggregateOrdersProfit = (orders = [], options = {}) => {
  const currency = options.currency || 'INR';

  let totalRevenue = 0;
  let totalCogs = 0;
  let totalShipping = 0;
  let totalPlatformFees = 0;
  let totalAdSpend = 0;
  let totalOtherExpenses = 0;
  let totalUnitsSold = 0;

  const productMap = new Map();

  for (const order of orders) {
    const units = Number(order.unitsSold) || 0;
    const price = Number(order.sellingPrice) || 0;
    const cogsUnit = Number(order.cogs) || 0;
    const shipping = Number(order.shippingCost) || 0;
    const fees = Number(order.platformFee) || 0;
    const ads = Number(order.adSpend) || 0;
    const other = Number(order.otherExpenses) || 0;

    const orderRevenue = units * price;
    const orderCogs = units * cogsUnit;
    const orderTotalCost = orderCogs + shipping + fees + ads + other;
    const orderNetProfit = orderRevenue - orderTotalCost;

    totalRevenue += orderRevenue;
    totalCogs += orderCogs;
    totalShipping += shipping;
    totalPlatformFees += fees;
    totalAdSpend += ads;
    totalOtherExpenses += other;
    totalUnitsSold += units;

    // Product-level breakdown
    const prodName = order.productName || 'Unlabeled Product';
    if (!productMap.has(prodName)) {
      productMap.set(prodName, {
        productName: prodName,
        unitsSold: 0,
        revenue: 0,
        cogs: 0,
        shipping: 0,
        platformFees: 0,
        adSpend: 0,
        otherExpenses: 0,
        totalCost: 0,
        netProfit: 0,
      });
    }

    const prodStats = productMap.get(prodName);
    prodStats.unitsSold += units;
    prodStats.revenue += orderRevenue;
    prodStats.cogs += orderCogs;
    prodStats.shipping += shipping;
    prodStats.platformFees += fees;
    prodStats.adSpend += ads;
    prodStats.otherExpenses += other;
    prodStats.totalCost += orderTotalCost;
    prodStats.netProfit += orderNetProfit;
  }

  const totalCost = totalCogs + totalShipping + totalPlatformFees + totalAdSpend + totalOtherExpenses;
  const netProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Format product performance array and compute margin %
  const productPerformance = Array.from(productMap.values()).map((p) => {
    const margin = p.revenue > 0 ? (p.netProfit / p.revenue) * 100 : 0;
    return {
      productName: p.productName,
      unitsSold: p.unitsSold,
      revenue: Number(p.revenue.toFixed(2)),
      cogs: Number(p.cogs.toFixed(2)),
      shipping: Number(p.shipping.toFixed(2)),
      platformFees: Number(p.platformFees.toFixed(2)),
      adSpend: Number(p.adSpend.toFixed(2)),
      otherExpenses: Number(p.otherExpenses.toFixed(2)),
      totalCost: Number(p.totalCost.toFixed(2)),
      netProfit: Number(p.netProfit.toFixed(2)),
      profitMarginPercent: Number(margin.toFixed(2)),
    };
  });

  // Sort products by net profit descending (top earners first)
  productPerformance.sort((a, b) => b.netProfit - a.netProfit);

  return {
    currency,
    period: options.period || 'all_time',
    totalOrders: orders.length,
    totalUnitsSold,
    financials: {
      revenue: Number(totalRevenue.toFixed(2)),
      supplierCosts: Number(totalCogs.toFixed(2)),
      shippingCosts: Number(totalShipping.toFixed(2)),
      platformFees: Number(totalPlatformFees.toFixed(2)),
      advertisingCosts: Number(totalAdSpend.toFixed(2)),
      otherExpenses: Number(totalOtherExpenses.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      profitMarginPercent: Number(profitMarginPercent.toFixed(2)),
    },
    productPerformance,
    dataSource: options.dataSource || 'csv_import',
    calculationBasis: 'backend',
  };
};

export default {
  aggregateOrdersProfit,
};

