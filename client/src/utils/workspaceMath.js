export function calculateUnitEconomics(price, costs) {
  const sellingPrice = Math.max(0, Number(price) || 0);
  const total = Object.values(costs).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  const profit = sellingPrice - total;
  const adAllowance = sellingPrice - total + Math.max(0, Number(costs.advertising) || 0);
  return { total, profit, margin: sellingPrice > 0 ? profit / sellingPrice * 100 : 0, breakEvenRoas: adAllowance > 0 ? sellingPrice / adAllowance : null };
}
export function calculateGoal(target, achieved, profitPerOrder, date = new Date()) {
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() - date.getDate() + 1;
  const remaining = Math.max(0, Number(target) - Number(achieved));
  const orders = Math.ceil(remaining / Math.max(1, Number(profitPerOrder) || 1));
  return { remaining, days, dailyProfit: Math.ceil(remaining / days), orders, dailyOrders: Math.ceil(orders / days) };
}
