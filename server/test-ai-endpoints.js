/**
 * End-to-end HTTP integration test for Member 3's AI API Endpoints:
 * - T-015: POST /api/listings/generate
 * - T-020: POST /api/listings/generate-marketing
 * - T-024: POST /api/goals/recovery-assistant & POST /api/goals/:id/recovery-chat
 */

import jwt from 'jsonwebtoken';
import app from './src/app.js';
import config from './src/config/environment.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runEndpointTests() {
  console.log('\n======================================================');
  console.log('DropPilot AI — Member 3 Endpoints Test (T-015, T-020, T-024)');
  console.log('======================================================\n');

  // Generate test auth token
  const testToken = jwt.sign(
    { userId: 'test-user-123', email: 'test@droppilot.ai', role: 'seller' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`,
  };

  // Start Express on dynamic port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // -------------------------------------------------------------------------
    // Negative test: 401 Unauthorized without token
    // -------------------------------------------------------------------------
    console.log('--- Auth Protection Check ---');
    const unauthRes = await fetch(`${baseUrl}/listings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productTitle: 'Test' }),
    });
    assert(unauthRes.status === 401, 'POST /api/listings/generate rejects request without auth token (401)');

    // -------------------------------------------------------------------------
    // Task T-015: AI Listing Generation Endpoint
    // -------------------------------------------------------------------------
    console.log('\n--- Task T-015: AI Listing Generation (POST /api/listings/generate) ---');
    const listingRes = await fetch(`${baseUrl}/listings/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        productTitle: 'Ultra-Slim Wireless Charging Pad',
        features: ['15W Qi fast charging', 'Aerospace aluminum body', 'Foreign object detection'],
        specifications: { input: 'USB-C 9V/2A', dimensions: '100x100x6mm' },
        tone: 'professional',
        targetAudience: 'Tech enthusiasts and remote professionals',
      }),
    });

    assert(listingRes.status === 200, 'POST /api/listings/generate returns 200 OK');
    const listingJson = await listingRes.json();
    assert(listingJson.success === true, 'Response conforms to formatSuccess wrapper');
    const listingData = listingJson.data;
    assert(typeof listingData.title === 'string' && listingData.title.length > 0, 'Generated title exists');
    assert(typeof listingData.description === 'string' && listingData.description.length > 0, 'Generated description exists');
    assert(Array.isArray(listingData.keyFeatures) && listingData.keyFeatures.length > 0, 'Generated keyFeatures is non-empty array');
    assert(typeof listingData.seoTitle === 'string' && listingData.seoTitle.length <= 70, 'Generated seoTitle conforms to length limit');
    assert(typeof listingData.seoDescription === 'string' && listingData.seoDescription.length <= 170, 'Generated seoDescription conforms to length limit');
    assert(Array.isArray(listingData.keywords) && listingData.keywords.length > 0, 'Generated keywords array exists');
    assert(listingData.generatedBy === 'gemini', 'Listing metadata has generatedBy: gemini');
    assert(listingData.status === 'draft', 'Listing metadata defaults to status: draft');

    // -------------------------------------------------------------------------
    // Task T-020: Multi-Platform Social Content (POST /api/listings/generate-marketing)
    // -------------------------------------------------------------------------
    console.log('\n--- Task T-020: Multi-Platform Content (POST /api/listings/generate-marketing) ---');
    const marketingRes = await fetch(`${baseUrl}/listings/generate-marketing`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        productTitle: 'Ultra-Slim Wireless Charging Pad',
        sellingPoints: ['No more messy cables', 'Charges through cases up to 5mm', 'Sleek aluminum finish'],
        targetAudience: 'Minimalist desk creators',
        tone: 'viral and energetic',
      }),
    });

    assert(marketingRes.status === 200, 'POST /api/listings/generate-marketing returns 200 OK');
    const marketingJson = await marketingRes.json();
    assert(marketingJson.success === true, 'Response conforms to formatSuccess wrapper');
    const marketingData = marketingJson.data;
    assert(typeof marketingData.tiktokHook === 'string' && marketingData.tiktokHook.length > 0, 'TikTok hook generated');
    assert(typeof marketingData.instagramCaption === 'string' && marketingData.instagramCaption.includes('#'), 'Instagram caption contains hashtags');
    assert(typeof marketingData.adScript === 'string' && marketingData.adScript.length > 0, 'Short video ad script generated');
    assert(marketingData.shopifySeo && typeof marketingData.shopifySeo.metaTitle === 'string', 'Shopify SEO metaTitle generated');
    assert(Array.isArray(marketingData.shopifySeo?.keywords) && marketingData.shopifySeo.keywords.length > 0, 'Shopify SEO keywords array generated');

    // -------------------------------------------------------------------------
    // Task T-024: Goal Recovery Assistant (POST /api/goals/recovery-assistant)
    // -------------------------------------------------------------------------
    console.log('\n--- Task T-024: Goal Recovery Assistant (POST /api/goals/recovery-assistant) ---');
    const recoveryRes = await fetch(`${baseUrl}/goals/recovery-assistant`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        question: 'Why am I ₹25,000 behind my net profit goal this month?',
        goalMetrics: {
          target: 10000000, // ₹100,000 in paise
          currentNetProfit: 7500000, // ₹75,000 in paise
          remainingProfit: 2500000,
          progressPercent: 75.0,
        },
        financials: {
          revenue: 35000000, // ₹350,000 in paise
          supplierCosts: 18000000, // ₹180,000 in paise
          advertisingCosts: 8000000, // ₹80,000 in paise
          shippingCosts: 1500000,
          otherExpenses: 0,
        },
        dataSource: 'csv_import',
      }),
    });

    assert(recoveryRes.status === 200, 'POST /api/goals/recovery-assistant returns 200 OK');
    const recoveryJson = await recoveryRes.json();
    assert(recoveryJson.success === true, 'Response conforms to formatSuccess wrapper');
    const recoveryData = recoveryJson.data;
    assert(typeof recoveryData.answer === 'string' && recoveryData.answer.length > 0, 'Recovery answer generated');
    assert(Array.isArray(recoveryData.possibleReasons) && recoveryData.possibleReasons.length > 0, 'Grounded possible reasons provided');
    assert(Array.isArray(recoveryData.suggestedActions) && recoveryData.suggestedActions.length > 0, 'Actionable recommendations provided');
    assert(Array.isArray(recoveryData.limitations) && recoveryData.limitations.length > 0, 'Required financial limitations disclosed');

    // -------------------------------------------------------------------------
    // Task T-024 (Variant 2): Goal-specific Recovery Chat route
    // -------------------------------------------------------------------------
    console.log('\n--- Task T-024: Goal Chat by ID (POST /api/goals/:id/recovery-chat) ---');
    const chatRes = await fetch(`${baseUrl}/goals/goal_001/recovery-chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        question: 'How can I optimize ad spend to bridge the gap?',
        goalMetrics: { target: 5000000, currentNetProfit: 3000000 },
        financials: { revenue: 15000000, advertisingCosts: 6000000, supplierCosts: 6000000 },
      }),
    });
    assert(chatRes.status === 200, 'POST /api/goals/:id/recovery-chat returns 200 OK');
    const chatJson = await chatRes.json();
    assert(chatJson.success === true && Boolean(chatJson.data.answer), 'Goal recovery chat responds with verified guidance');

    console.log('\n======================================================');
    console.log(`Results: ${passed}/${total} endpoint tests passed`);
    console.log('======================================================\n');

    if (passed === total) {
      console.log('✅ ALL MEMBER 3 AI ENDPOINTS (T-015, T-020, T-024) VERIFIED SUCCESSFULLY!\n');
    } else {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runEndpointTests().catch((err) => {
  console.error('Endpoint test runner encountered an error:', err);
  process.exit(1);
});

