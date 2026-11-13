import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { toPricingPayload, readPricingEstimate } from '../src/utils/pricingContract.js';

const defaults = { sellingPrice: '999', supplierCost: '500', shippingCost: '50', platformFees: '30', advertisingCostPerOrder: '70', otherCosts: '0' };
const ref = 'origin/feature/backend-api';
const readBackend = path => execFileSync('git', ['show', `${ref}:server/src/${path}`], { encoding: 'utf8' });
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const calculator = url(readBackend('utils/financialCalculator.js'));
const service = url(readBackend('services/pricingService.js').replace('../utils/financialCalculator.js', calculator));
const validator = url(readBackend('validators/pricingValidator.js'));
const formatter = url(readBackend('utils/responseFormatter.js'));
const controller = await import(url(readBackend('controllers/pricingController.js')
  .replace('../utils/responseFormatter.js', formatter)
  .replace('../services/pricingService.js', service)
  .replace('../validators/pricingValidator.js', validator)));

async function calculate(body) {
  let status = 200;
  let response;
  await controller.calculatePrice({ body }, {
    status(code) { status = code; return this; },
    json(value) { response = value; return this; },
  }, error => { throw error; });
  return { status, response };
}

test('Member 2 controller matches the PRD example through the frontend adapter', async () => {
  const { status, response } = await calculate(toPricingPayload(defaults));
  const result = readPricingEstimate(response);
  assert.equal(status, 200);
  assert.equal(result.totalCost, 65000);
  assert.equal(result.estimatedProfit, 34900);
  assert.equal(result.profitMarginPercent, 34.93);
});
test('all editable costs and decimal rupees are transmitted as integer paise', async () => {
  const payload = toPricingPayload({ ...defaults, sellingPrice: '1000.10', otherCosts: '0.20' });
  assert.equal(payload.sellingPrice, 100010);
  assert.equal(payload.otherCosts, 20);
  const { response } = await calculate(payload);
  assert.equal(readPricingEstimate(response).estimatedProfit, 35010 - 20);
});
test('zero and loss-making prices return valid backend estimates', async () => {
  const zero = readPricingEstimate((await calculate(toPricingPayload({ ...defaults, sellingPrice: '0' }))).response);
  assert.equal(zero.estimatedProfit, -65000);
  assert.equal(zero.profitMarginPercent, 0);
  const loss = readPricingEstimate((await calculate(toPricingPayload({ ...defaults, sellingPrice: '600' }))).response);
  assert.equal(loss.estimatedProfit, -5000);
  assert.equal(loss.profitMarginPercent, -8.33);
});
test('blank, negative, non-finite, excessive, and fractional-paise inputs never reach the API', () => {
  for (const field of Object.keys(defaults)) {
    for (const value of ['', '-1', 'NaN', 'Infinity', '1.001', '1000000001']) {
      assert.throws(() => toPricingPayload({ ...defaults, [field]: value }));
    }
  }
});
test('Member 2 controller returns validation errors for invalid direct requests', async () => {
  const { status, response } = await calculate({ sellingPrice: -1, supplierCost: 1 });
  assert.equal(status, 400);
  assert.equal(response.success, false);
});
test('old backend responses and malformed results cannot masquerade as estimates', () => {
  assert.throws(() => readPricingEstimate({ data: { totalCost: 650, netProfit: 349 } }));
  assert.throws(() => readPricingEstimate({ success: true, data: { currency: 'INR', calculationBasis: 'backend', isEstimate: true, totalCost: NaN, estimatedProfit: 1, profitMarginPercent: 1 } }));
});
