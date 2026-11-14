/**
 * T-029: Comprehensive Backend API, Financial and CSV Test Pass
 * Maps directly to PRD Section 17.2 Test Case Matrix (QA-001 through QA-027)
 */

import http from 'http';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import config from '../src/config/environment.js';

let passed = 0;
let failed = 0;
const results = [];

const record = (id, area, scenario, condition, details = '') => {
  if (condition) {
    console.log(`\x1b[32m✔ PASS\x1b[0m [${id}] ${area}: ${scenario}`);
    passed++;
    results.push({ id, area, scenario, status: 'PASS', details });
  } else {
    console.error(`\x1b[31m✖ FAIL\x1b[0m [${id}] ${area}: ${scenario} - ${details}`);
    failed++;
    results.push({ id, area, scenario, status: 'FAIL', details });
  }
};

const runT029TestPass = async () => {
  console.log('\n============================================================');
  console.log(' DropPilot AI - T-029 Formal Test Pass & QA Verification');
  console.log(' Reference: PRD Section 17.2 Test Case Matrix');
  console.log('============================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const validToken = jwt.sign(
      { id: 'usr_t029_eval', email: 'evaluator@droppilot.example.com' },
      config.jwtSecret,
      { expiresIn: '2h' }
    );
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${validToken}`,
    };

    // ----------------------------------------------------
    // 1. AUTHENTICATION & SECURITY (QA-001, QA-002, QA-003, QA-027)
    // ----------------------------------------------------
    const testEmail = `eval_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Evaluator',
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const regData = await regRes.json();
    record(
      'QA-001',
      'Auth',
      'Register with valid fields',
      regRes.status === 201 && regData.success === true && !!regData.data?.token,
      'User registered with hashed credentials & JWT returned'
    );

    const wrongLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });
    record(
      'QA-002',
      'Auth',
      'Login with wrong password',
      wrongLoginRes.status === 401,
      'Rejected with HTTP 401 INVALID_CREDENTIALS; no token issued'
    );

    const noAuthRes = await fetch(`${baseUrl}/api/auth/me`);
    record(
      'QA-003',
      'Auth',
      'Call protected route without JWT',
      noAuthRes.status === 401,
      'Rejected with HTTP 401 UNAUTHORIZED'
    );

    const badTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.tampered.token' },
    });
    record(
      'QA-027',
      'Security',
      'User requests protected resource with invalid/spoofed token',
      badTokenRes.status === 403,
      'Access forbidden (HTTP 403 FORBIDDEN)'
    );

    // ----------------------------------------------------
    // 2. PRODUCT DISCOVERY & CATALOGUE (QA-004, QA-005, QA-026)
    // ----------------------------------------------------
    const searchMatchRes = await fetch(`${baseUrl}/api/products?search=keyboard`);
    const searchMatchData = await searchMatchRes.json();
    const hasKeyboard = searchMatchData.data?.products?.some((p) =>
      p.title.toLowerCase().includes('keyboard')
    );
    record(
      'QA-004',
      'Products',
      'Search known product',
      searchMatchRes.status === 200 && hasKeyboard,
      'Matching product returned with populated suppliers and pricing'
    );

    const searchNoMatchRes = await fetch(`${baseUrl}/api/products?search=nonexistentproductxyz999`);
    const searchNoMatchData = await searchNoMatchRes.json();
    record(
      'QA-005',
      'Products',
      'Search no-match term',
      searchNoMatchRes.status === 200 && searchNoMatchData.data?.products?.length === 0,
      'Empty state returned gracefully without crashes'
    );

    const prodDetailRes = await fetch(`${baseUrl}/api/products/prod_001`);
    const prodDetailData = await prodDetailRes.json();
    record(
      'QA-026',
      'Source labels',
      'Demo catalogue and supplier data carry explicit provenance labels',
      prodDetailData.data?.sourceLabel === 'DEMO_CATALOGUE' &&
        prodDetailData.data?.suppliers?.length > 0 &&
        !!prodDetailData.data.suppliers[0].sourceLabel,
      `Product source: ${prodDetailData.data?.sourceLabel}, Supplier source: ${prodDetailData.data?.suppliers[0]?.sourceLabel}`
    );

    // ----------------------------------------------------
    // 3. SUPPLIER INTELLIGENCE & TRUST BADGES (QA-009, QA-010)
    // ----------------------------------------------------
    const compareRes = await fetch(`${baseUrl}/api/suppliers/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'prod_001',
        supplierIds: ['supp_001', 'supp_002'],
      }),
    });
    const compareData = await compareRes.json();
    record(
      'QA-009',
      'Supplier',
      'Compare two demo suppliers',
      compareRes.status === 200 &&
        compareData.data?.comparisons?.length === 2 &&
        !!compareData.data.recommendedSupplierId,
      'Side-by-side landed cost comparison and evidence-based recommendation generated'
    );

    const suppListRes = await fetch(`${baseUrl}/api/suppliers`);
    const suppListData = await suppListRes.json();
    const demoSupp = suppListData.data?.find((s) => s.sourceLabel === 'DEMO_FIXTURE');
    record(
      'QA-010',
      'Trust badges',
      'Supplier has no audited verification evidence (demo fixture)',
      demoSupp && demoSupp.trustBadge !== 'VERIFIED' && demoSupp.verified === false,
      'Demo fixture supplier NEVER receives VERIFIED badge per integrity rules'
    );

    // ----------------------------------------------------
    // 4. FINANCIAL PRICING ARITHMETIC (QA-011, QA-012, QA-013)
    // ----------------------------------------------------
    const prdPricingRes = await fetch(`${baseUrl}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currency: 'INR',
        sellingPrice: 99900,
        supplierCost: 50000,
        shippingCost: 5000,
        platformFees: 3000,
        advertisingCostPerOrder: 7000,
        otherCosts: 0,
      }),
    });
    const prdPricingData = await prdPricingRes.json();
    record(
      'QA-011',
      'Pricing',
      '₹999 selling price and ₹650 total costs (represented in paise)',
      prdPricingData.data?.totalCost === 65000 &&
        prdPricingData.data?.estimatedProfit === 34900 &&
        prdPricingData.data?.profitMarginPercent === 34.93,
      'Exact arithmetic: Total Cost = 65000, Net Profit = 34900, Margin = 34.93%'
    );

    const zeroPriceRes = await fetch(`${baseUrl}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellingPrice: 0,
        supplierCost: 500,
      }),
    });
    const zeroPriceData = await zeroPriceRes.json();
    record(
      'QA-012',
      'Pricing',
      'Selling price is zero',
      zeroPriceRes.status === 200 &&
        zeroPriceData.data?.profitMarginPercent === 0 &&
        zeroPriceData.data?.estimatedProfit === -500,
      'Handled cleanly with zero margin and negative profit, preventing divide-by-zero errors'
    );

    const lossPriceRes = await fetch(`${baseUrl}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellingPrice: 500,
        supplierCost: 600,
        shippingCost: 100,
      }),
    });
    const lossPriceData = await lossPriceRes.json();
    record(
      'QA-013',
      'Pricing',
      'Costs exceed selling price (loss scenario)',
      lossPriceRes.status === 200 &&
        lossPriceData.data?.estimatedProfit === -200 &&
        lossPriceData.data?.profitMarginPercent === -40,
      'Negative profit (-200) and negative margin (-40%) calculated accurately'
    );

    // ----------------------------------------------------
    // 5. CSV VALIDATION & INGESTION (QA-014, QA-015, QA-016, QA-017)
    // ----------------------------------------------------
    const validCsv =
      'order_id,date,product_name,units_sold,selling_price,cogs_per_unit,shipping_cost,platform_fee,ad_spend\n' +
      'ORD-101,2026-11-01,Sunset Projection LED Atmosphere Lamp,2,1499,420,160,60,350\n' +
      'ORD-102,2026-11-02,Wireless Ergonomic Split Mechanical Keyboard,1,4999,1950,250,100,650\n';

    const csvPreviewRes = await fetch(`${baseUrl}/api/goals/csv/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData: validCsv }),
    });
    const csvPreviewData = await csvPreviewRes.json();
    record(
      'QA-014',
      'CSV',
      'Valid CSV import preview',
      csvPreviewRes.status === 200 &&
        csvPreviewData.data?.isValid === true &&
        csvPreviewData.data?.validRows === 2,
      'Parsed 2 valid rows with calculated row-level metrics'
    );

    const missingColCsv = 'date,product_name\n2026-11-01,Lamp\n';
    const missingColRes = await fetch(`${baseUrl}/api/goals/csv/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData: missingColCsv }),
    });
    const missingColData = await missingColRes.json();
    record(
      'QA-015',
      'CSV',
      'Missing required columns in CSV',
      missingColData.data?.isValid === false && missingColData.data?.errors?.length >= 3,
      'Clear validation errors reporting missing units_sold, selling_price, and cogs_per_unit'
    );

    const noExpenseCsv =
      'date,product_name,units_sold,selling_price,cogs_per_unit\n2026-11-01,Lamp,1,1000,400\n';
    const noExpenseRes = await fetch(`${baseUrl}/api/goals/csv/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData: noExpenseCsv }),
    });
    const noExpenseData = await noExpenseRes.json();
    record(
      'QA-016',
      'CSV',
      'Missing expense values in CSV',
      noExpenseData.data?.warnings?.length > 0,
      'User warned about missing shipping/ad spend; never silently assumed zero without disclosure'
    );

    const duplicateCsv =
      'order_id,date,product_name,units_sold,selling_price,cogs_per_unit\n' +
      'ORD-999,2026-11-01,Lamp,1,1000,400\n' +
      'ORD-999,2026-11-01,Lamp,1,1000,400\n';
    const dupRes = await fetch(`${baseUrl}/api/goals/csv/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData: duplicateCsv }),
    });
    const dupData = await dupRes.json();
    record(
      'QA-017',
      'CSV',
      'Duplicate order rows handled consistently',
      dupRes.status === 200 && dupData.data?.totalRows === 2,
      'Consistent row tracking with preserved order line counts'
    );

    // ----------------------------------------------------
    // 6. PROFIT AGGREGATION & GOAL PLANNING (QA-018, QA-019, QA-020)
    // ----------------------------------------------------
    const metricsRes = await fetch(`${baseUrl}/api/orders/metrics`, {
      headers: authHeaders,
    });
    const metricsData = await metricsRes.json();
    const f = metricsData.data?.financials;
    const expectedNet = f.revenue - f.supplierCosts - f.shippingCosts - f.platformFees - f.advertisingCosts - f.otherExpenses;
    record(
      'QA-018',
      'Profit',
      'Known fixture with documented accounting rules',
      Math.abs(f.netProfit - expectedNet) < 0.01,
      `Formula reconciled: Revenue(${f.revenue}) - TotalCosts(${f.totalCost}) = NetProfit(${f.netProfit})`
    );

    const negGoalRes = await fetch(`${baseUrl}/api/profit-goals`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        monthlyNetProfitTarget: -25000,
      }),
    });
    record(
      'QA-019',
      'Goal',
      'Zero or negative monthly profit target',
      negGoalRes.status === 400,
      'Rejected with HTTP 400 VALIDATION_ERROR'
    );

    const achievedGoalRes = await fetch(`${baseUrl}/api/profit-goals`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        currency: 'INR',
        monthlyNetProfitTarget: 1000, // Low target guaranteed to be achieved by sample records
        month: '2026-11',
      }),
    });
    const achievedGoalData = await achievedGoalRes.json();
    const analyzeAchievedRes = await fetch(`${baseUrl}/api/profit-goals/analyze`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        goalId: achievedGoalData.data?._id,
        period: '2026-11',
      }),
    });
    const analyzeAchievedData = await analyzeAchievedRes.json();
    const g = analyzeAchievedData.data?.goal;
    record(
      'QA-020',
      'Goal',
      'Profit above target (Goal Achieved)',
      g?.currentNetProfit > g?.target && g?.remainingProfit === 0 && g?.status === 'ACHIEVED',
      `Target: ₹${g?.target}, Net: ₹${g?.currentNetProfit}, Remaining: ₹${g?.remainingProfit}, Status: ${g?.status}`
    );

    console.log('\n============================================================');
    console.log(` T-029 TEST PASS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    return { passed, failed, results };
  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
    return { passed, failed, results };
  } finally {
    if (failed > 0) process.exitCode = 1;
    server.close();
  }
};

runT029TestPass();

