/**
 * Verification Test Suite: Supplier Intelligence & Trust Badges (T-011 / T-012 / T-019)
 * Validates PRD Section 3.4, 3.7, 10.4 and QA-010 requirements.
 */

import http from 'http';
import app from '../src/app.js';
import {
  evaluateTrustProvenance,
  compareSuppliersList,
} from '../src/services/suppliers/supplierComparison.js';

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

const runSupplierTests = async () => {
  console.log('\n========================================');
  console.log(' DropPilot Backend Verification: T-011 & T-012 Supplier API');
  console.log('========================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // ----------------------------------------------------
    // Unit Test: Trust Badges & Evidence Rules (FR-008, QA-010)
    // ----------------------------------------------------
    const verifiedSupplier = {
      name: 'Apex Glow Logistics',
      sourceLabel: 'VERIFIED_PARTNER',
      sourceType: 'verified_partner',
      trustScore: 95,
      fulfillmentRate: 99.2,
      rating: 4.8,
    };
    const verifiedProv = evaluateTrustProvenance(verifiedSupplier);
    assert(
      verifiedProv.trustBadge === 'VERIFIED' && verifiedProv.verified === true,
      'T-019: Verified partner with high score receives VERIFIED badge and verified: true'
    );

    const demoSupplier = {
      name: 'QuickDrop Local Hub',
      sourceLabel: 'DEMO_FIXTURE',
      sourceType: 'demo',
      trustScore: 75,
      fulfillmentRate: 92.0,
      rating: 4.2,
    };
    const demoProv = evaluateTrustProvenance(demoSupplier);
    assert(
      demoProv.trustBadge !== 'VERIFIED' && demoProv.verified === false && demoProv.isDemo === true,
      'QA-010 & PRD Rule: Demo fixture supplier NEVER receives VERIFIED badge (verified: false, isDemo: true)'
    );

    const unverifiedSupplier = {
      name: 'Risk Supplier',
      sourceLabel: 'DEMO_FIXTURE',
      sourceType: 'demo',
      trustScore: 40,
      fulfillmentRate: 70.0,
    };
    const unverifiedProv = evaluateTrustProvenance(unverifiedSupplier);
    assert(
      unverifiedProv.verified === false,
      'T-019: Low trust / unverified supplier has verified: false'
    );

    // ----------------------------------------------------
    // Service Test: compareSuppliersList
    // ----------------------------------------------------
    const compareRes = await compareSuppliersList({
      productId: 'prod_001',
      supplierIds: ['supp_001', 'supp_002', 'supp_003'],
    });

    assert(
      Array.isArray(compareRes.comparisons) && compareRes.comparisons.length === 3,
      'T-012: compareSuppliersList returns side-by-side array of 3 comparisons for prod_001'
    );

    assert(
      typeof compareRes.recommendedSupplierId === 'string' && compareRes.recommendationReason.length > 0,
      'T-012: compareSuppliersList includes recommendedSupplierId and evidence-based recommendationReason'
    );

    // Check landed cost calculation
    const supp1 = compareRes.comparisons.find((s) => s.supplierId === 'supp_001');
    assert(
      supp1 && supp1.totalLandedCost === supp1.unitCost + supp1.shippingCost,
      'T-012: Correctly computes totalLandedCost = unitCost + shippingCost'
    );

    // ----------------------------------------------------
    // API Endpoint Tests: GET /api/suppliers
    // ----------------------------------------------------
    const listRes = await fetch(`${baseUrl}/api/suppliers`);
    const listData = await listRes.json();
    assert(
      listRes.status === 200 && listData.success === true && Array.isArray(listData.data) && listData.data.length >= 6,
      'T-011: GET /api/suppliers returns list of labelled suppliers (HTTP 200)'
    );

    // ----------------------------------------------------
    // API Endpoint Tests: POST /api/suppliers/compare
    // ----------------------------------------------------
    const postCompareRes = await fetch(`${baseUrl}/api/suppliers/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'prod_001',
        supplierIds: ['supp_001', 'supp_002'],
      }),
    });
    const postCompareData = await postCompareRes.json();
    assert(
      postCompareRes.status === 200 &&
        postCompareData.success === true &&
        postCompareData.data.comparisons.length === 2 &&
        !!postCompareData.data.recommendedSupplierId,
      'T-012: POST /api/suppliers/compare matches PRD 10.4 request/response format (HTTP 200)'
    );

    // ----------------------------------------------------
    // API Endpoint Tests: GET /api/suppliers/:id
    // ----------------------------------------------------
    const detailRes = await fetch(`${baseUrl}/api/suppliers/supp_001`);
    const detailData = await detailRes.json();
    assert(
      detailRes.status === 200 && detailData.success === true && detailData.data.name === 'Apex Glow Logistics',
      'T-011: GET /api/suppliers/:id returns supplier details by ID (HTTP 200)'
    );

    const notFoundRes = await fetch(`${baseUrl}/api/suppliers/unknown_supp_xyz`);
    assert(
      notFoundRes.status === 404,
      'T-011: GET /api/suppliers/:id returns 404 for unknown supplier'
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

runSupplierTests();
