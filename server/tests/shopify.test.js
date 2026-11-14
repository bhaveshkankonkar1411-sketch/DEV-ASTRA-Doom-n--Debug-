/**
 * Verification Test Suite: Shopify Store Connection & Sync (T-026)
 * Validates PRD Section 3.5, 10.6, and Demo Integrity Rules (FR-010).
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import config from '../src/config/environment.js';

let passed = 0;
let failed = 0;

const assert = (condition, description) => {
  if (condition) {
    console.log(`✔ PASS - ${description}`);
    passed++;
  } else {
    console.error(`✖ FAIL - ${description}`);
    failed++;
  }
};

const runShopifyTests = async () => {
  console.log('\n========================================');
  console.log(' DropPilot Backend Verification: T-026 Shopify Store Sync API');
  console.log('========================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // Generate test JWT for authenticated routes
  const token = jwt.sign(
    { id: 'usr_test_shopify', email: 'merchant@droppilot.example.com' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  try {
    // ----------------------------------------------------
    // Test 1: GET /api/shopify/status
    // ----------------------------------------------------
    const statusRes = await fetch(`${baseUrl}/api/shopify/status`, {
      headers: authHeaders,
    });
    const statusData = await statusRes.json();
    assert(
      statusRes.status === 200 &&
        statusData.success === true &&
        statusData.data.store === 'shopify' &&
        typeof statusData.data.isSimulated === 'boolean',
      'T-026: GET /api/shopify/status returns store connection metadata with explicit disclosure (HTTP 200)'
    );

    // ----------------------------------------------------
    // Test 2: Also accessible via /api/stores/shopify/status (PRD 10.6 standard path)
    // ----------------------------------------------------
    const aliasStatusRes = await fetch(`${baseUrl}/api/stores/shopify/status`, {
      headers: authHeaders,
    });
    assert(
      aliasStatusRes.status === 200,
      'T-026: GET /api/stores/shopify/status PRD Section 10.6 endpoint alias functions identically'
    );

    // ----------------------------------------------------
    // Test 3: POST /api/shopify/connect
    // ----------------------------------------------------
    const connectRes = await fetch(`${baseUrl}/api/shopify/connect`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ shopDomain: 'my-store.myshopify.com' }),
    });
    const connectData = await connectRes.json();
    assert(
      connectRes.status === 200 &&
        connectData.success === true &&
        connectData.data.connected === true,
      'T-026: POST /api/shopify/connect handles store connection (HTTP 200)'
    );

    // ----------------------------------------------------
    // Test 4: POST /api/shopify/sync with valid PRD Section 10.6 payload
    // ----------------------------------------------------
    const syncPayload = {
      productId: 'prod_001',
      listing: {
        title: 'Sunset Projection LED Atmosphere Lamp',
        descriptionHtml: '<p>Romantic 360-degree rotation visual sunset lamp.</p>',
        price: '1499.00',
        currency: 'INR',
      },
      mode: 'create',
    };

    const syncRes = await fetch(`${baseUrl}/api/shopify/sync`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(syncPayload),
    });
    const syncData = await syncRes.json();

    assert(
      syncRes.status === 200 &&
        syncData.success === true &&
        syncData.data.status === 'synced' &&
        !!syncData.data.externalProductId &&
        !!syncData.data.syncedAt,
      'T-026: POST /api/shopify/sync returns confirmed sync response matching PRD 10.6 format'
    );

    // ----------------------------------------------------
    // Test 5: Fallback disclosure check (PRD Demo Integrity rule)
    // ----------------------------------------------------
    assert(
      typeof syncData.data.isSimulated === 'boolean' &&
        typeof syncData.data.disclosure === 'string' &&
        syncData.data.disclosure.length > 0,
      'T-026 & Demo Integrity: Sync response carries integrity disclosure (live or simulated)'
    );

    // ----------------------------------------------------
    // Test 6: Rejection of invalid payload (missing title)
    // ----------------------------------------------------
    const invalidSyncRes = await fetch(`${baseUrl}/api/shopify/sync`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        productId: 'prod_001',
        listing: {},
      }),
    });
    assert(
      invalidSyncRes.status === 400,
      'T-026: Rejects sync payload when listing title is missing (HTTP 400)'
    );

    // ----------------------------------------------------
    // Test 7: Disconnect Store (PRD 10.6)
    // ----------------------------------------------------
    const disconnectRes = await fetch(`${baseUrl}/api/shopify/disconnect`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const disconnectData = await disconnectRes.json();
    assert(
      disconnectRes.status === 200 && disconnectData.success === true,
      'T-026: DELETE /api/shopify/disconnect clears connection state (HTTP 200)'
    );
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n----------------------------------------');
    console.log(` Results: ${passed} passed, ${failed} failed`);
    console.log('----------------------------------------\n');

    if (failed > 0) {
      process.exit(1);
    }
  }
};

runShopifyTests();
