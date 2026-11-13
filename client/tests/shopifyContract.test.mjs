import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readShopifyStatus, readShopifySync, shopifyProductPayload } from '../src/utils/shopifyContract.js';

const statusResponse = overrides => ({
  data: {
    store: 'shopify',
    connected: true,
    shopDomain: 'demo-store.myshopify.com',
    isSimulated: true,
    statusLabel: 'CONNECTED_SIMULATED',
    disclosure: 'Demonstration Mode: no live Shopify account was changed.',
    ...overrides,
  },
});

const syncResponse = overrides => ({
  data: {
    store: 'shopify',
    status: 'synced',
    externalProductId: 'sim_product_123',
    syncedAt: '2026-11-13T10:00:00.000Z',
    isSimulated: true,
    disclosure: 'Simulated sync; no external account was changed.',
    ...overrides,
  },
});

test('Shopify connection status requires explicit connection and simulation state', () => {
  assert.equal(readShopifyStatus(statusResponse()).connected, true);
  assert.equal(readShopifyStatus(statusResponse({ connected: false })).connected, false);
  assert.throws(() => readShopifyStatus(statusResponse({ isSimulated: undefined })), /connection status/);
  assert.throws(() => readShopifyStatus(statusResponse({ disclosure: '' })), /connection status/);
});

test('Shopify sync requires a confirmed ID, timestamp, and simulation disclosure', () => {
  assert.equal(readShopifySync(syncResponse()).isSimulated, true);
  assert.equal(readShopifySync(syncResponse({ isSimulated: false, disclosure: undefined })).isSimulated, false);
  assert.throws(() => readShopifySync(syncResponse({ externalProductId: '' })), /did not confirm/);
  assert.throws(() => readShopifySync(syncResponse({ isSimulated: true, disclosure: '' })), /did not confirm/);
});

test('Shopify payload matches the single-listing API and escapes description HTML', () => {
  assert.deepEqual(shopifyProductPayload({
    id: 'lamp',
    name: 'Galaxy Lamp',
    price: 1599,
    features: 'Light <bright>\nA & B',
  }), {
    productId: 'lamp',
    listing: {
      title: 'Galaxy Lamp',
      descriptionHtml: '<p>Light &lt;bright&gt;<br>A &amp; B</p>',
      price: '1599.00',
      currency: 'INR',
    },
    mode: 'create',
  });
  assert.throws(() => shopifyProductPayload({ id: 'missing-price', name: 'Lamp', price: 0 }), /positive price/);
});
