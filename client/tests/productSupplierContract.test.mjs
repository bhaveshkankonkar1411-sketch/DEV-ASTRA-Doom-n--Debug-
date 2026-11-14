import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../../server/src/app.js';
import { normalizeProduct, readProductList } from '../src/utils/productContract.js';
import { readSupplierComparison } from '../src/utils/supplierContract.js';

const server = app.listen(0);
await once(server, 'listening');
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

test.after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

const product = overrides => ({
  id: 'prod_001',
  title: 'Projection Lamp',
  category: 'Home & Living',
  suggestedRetailPrice: 1499,
  estimatedCost: 500,
  demandScore: 94,
  trendVelocity: 'RISING',
  sourceLabel: 'DEMO_CATALOGUE',
  supplierIds: ['supp_001'],
  ...overrides,
});

test('product catalogue adapts backend records without losing provenance or supplier links', () => {
  const result = readProductList({ data: { products: [product()] } })[0];
  assert.equal(result.id, 'prod_001');
  assert.equal(result.name, 'Projection Lamp');
  assert.equal(result.price, 1499);
  assert.equal(result.cost, 500);
  assert.equal(result.sourceLabel, 'DEMO_CATALOGUE');
  assert.deepEqual(result.supplierIds, ['supp_001']);
  assert.throws(() => normalizeProduct(product({ sourceLabel: '' })), /invalid product/);
  assert.throws(() => readProductList({ data: { products: {} } }), /product catalogue/);
});

test('supplier comparison requires calculated values and provenance fields', () => {
  const supplier = {
    supplierId: 'supp_001',
    name: 'Apex Glow Logistics',
    unitCost: 420,
    shippingCost: 70,
    totalLandedCost: 490,
    estimatedShippingDays: '5-8',
    rating: 4.8,
    fulfillmentRate: 99.2,
    trustBadge: 'VERIFIED',
    verified: true,
    sourceLabel: 'VERIFIED_PARTNER',
    evidence: ['Audited partner'],
  };
  const response = { data: { comparisons: [supplier], recommendedSupplierId: 'supp_001', recommendationReason: 'Best value.' } };
  assert.equal(readSupplierComparison(response).comparisons[0].totalLandedCost, 490);
  assert.throws(() => readSupplierComparison({ data: { ...response.data, comparisons: [{ ...supplier, verified: undefined }] } }), /invalid supplier/);
});

test('product and supplier adapters accept responses from the merged backend', async () => {
  const catalogueResponse = await fetch(`${baseUrl}/products?limit=100`);
  assert.equal(catalogueResponse.status, 200);
  const catalogue = readProductList(await catalogueResponse.json());
  assert.ok(catalogue.length > 0);

  const product = catalogue[0];
  const comparisonResponse = await fetch(`${baseUrl}/suppliers/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: product.id, supplierIds: product.supplierIds }),
  });
  assert.equal(comparisonResponse.status, 200);
  const comparison = readSupplierComparison(await comparisonResponse.json());
  assert.ok(comparison.comparisons.length > 0);
  assert.ok(comparison.recommendedSupplierId);
});
