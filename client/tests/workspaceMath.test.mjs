import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateGoal, calculateUnitEconomics } from '../src/utils/workspaceMath.js';
test('all edited costs contribute to profit and break-even ROAS excludes ad spend', () => {
  const result = calculateUnitEconomics(1199, { product: 449, shipping: 80, advertising: 95, fees: 36 });
  assert.equal(result.total, 660);
  assert.equal(result.profit, 539);
  assert.equal(result.breakEvenRoas, 1199 / 634);
  assert.equal(calculateUnitEconomics(1199, { product: 500, shipping: 80, advertising: 95, fees: 36 }).profit, 488);
});
test('loss-making and zero-price scenarios avoid misleading break-even values', () => {
  assert.equal(calculateUnitEconomics(0, { product: 400 }).margin, 0);
  assert.equal(calculateUnitEconomics(300, { product: 400, advertising: 50 }).breakEvenRoas, null);
  assert.equal(calculateUnitEconomics(300, { product: 400 }).profit, -100);
});
test('goal plan includes today and rounds required orders upward', () => {
  assert.deepEqual(calculateGoal(62500, 42618, 539, new Date(2026, 10, 13)), { remaining: 19882, days: 18, dailyProfit: 1105, orders: 37, dailyOrders: 3 });
});
test('month-end, leap-year and completed goals remain valid', () => {
  assert.equal(calculateGoal(62500, 42618, 539, new Date(2026, 10, 30)).days, 1);
  assert.equal(calculateGoal(62500, 42618, 539, new Date(2028, 1, 28)).days, 2);
  assert.equal(calculateGoal(40000, 42618, 539).orders, 0);
  assert.equal(calculateGoal(40000, 42618, 539).dailyProfit, 0);
});
