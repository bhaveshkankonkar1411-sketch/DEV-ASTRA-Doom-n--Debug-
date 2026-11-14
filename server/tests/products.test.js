import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import config from '../src/config/environment.js';

const runProductTests = async () => {
  const PORT = 5097;
  const server = app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(` DropPilot Backend Verification: T-009 Product API`);
    console.log(`========================================\n`);

    let passed = 0;
    let failed = 0;

    const assert = (condition, description) => {
      if (condition) {
        console.log(`\x1b[32m✔ PASS\x1b[0m - ${description}`);
        passed++;
      } else {
        console.error(`\x1b[31m✘ FAIL\x1b[0m - ${description}`);
        failed++;
      }
    };

    try {
      const mockToken = jwt.sign(
        { id: 'usr_test_123', email: 'test@droppilot.example.com' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      // 1. GET /api/products - List all products
      const listRes = await fetch(`http://127.0.0.1:${PORT}/api/products`);
      const listData = await listRes.json();
      assert(
        listRes.status === 200 &&
          listData.success === true &&
          Array.isArray(listData.data?.products) &&
          listData.data.products.length > 0,
        'T-009: GET /api/products returns product list with pagination metadata (HTTP 200)'
      );

      // 2. GET /api/products?search=keyboard - Keyword search
      const searchRes = await fetch(`http://127.0.0.1:${PORT}/api/products?search=keyboard`);
      const searchData = await searchRes.json();
      assert(
        searchRes.status === 200 &&
          searchData.data.products.length === 1 &&
          searchData.data.products[0].title.toLowerCase().includes('keyboard'),
        'T-009: GET /api/products?search=keyboard filters catalogue by title/tag (HTTP 200)'
      );

      // 3. GET /api/products?category=Home & Living - Category filter
      const catRes = await fetch(`http://127.0.0.1:${PORT}/api/products?category=Home%20%26%20Living`);
      const catData = await catRes.json();
      assert(
        catRes.status === 200 &&
          catData.data.products.length > 0 &&
          catData.data.products.every((p) => p.category === 'Home & Living'),
        'T-009: GET /api/products?category=Home & Living filters by exact category (HTTP 200)'
      );

      // 4. GET /api/products?limit=2&page=1 - Pagination
      const pageRes = await fetch(`http://127.0.0.1:${PORT}/api/products?limit=2&page=1`);
      const pageData = await pageRes.json();
      assert(
        pageRes.status === 200 &&
          pageData.data.products.length === 2 &&
          pageData.data.pagination.limit === 2 &&
          pageData.data.pagination.page === 1,
        'T-009: GET /api/products pagination limits result items properly (HTTP 200)'
      );

      // 5. GET /api/products/:id - Product detail with populated suppliers
      const detailRes = await fetch(`http://127.0.0.1:${PORT}/api/products/prod_001`);
      const detailData = await detailRes.json();
      assert(
        detailRes.status === 200 &&
          detailData.data?.id === 'prod_001' &&
          Array.isArray(detailData.data?.suppliers) &&
          detailData.data.suppliers.length > 0 &&
          detailData.data.suppliers[0].name !== undefined,
        'T-009: GET /api/products/:id returns product details with populated suppliers (HTTP 200)'
      );

      // 6. GET /api/products/:id - 404 on invalid ID
      const notFoundRes = await fetch(`http://127.0.0.1:${PORT}/api/products/invalid_prod_999`);
      assert(notFoundRes.status === 404, 'T-009: GET /api/products/:id returns 404 for unknown product');

      // 7. POST /api/products/analyze - Deterministic financial & opportunity analysis
      const analyzeRes = await fetch(`http://127.0.0.1:${PORT}/api/products/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'prod_001',
          analysisContext: { targetMarket: 'IN', desiredMarginPercent: 35 },
        }),
      });
      const analyzeData = await analyzeRes.json();
      assert(
        analyzeRes.status === 200 &&
          analyzeData.data?.opportunityScore !== undefined &&
          analyzeData.data?.estimatedMarginPercent > 0 &&
          Array.isArray(analyzeData.data?.strengths) &&
          analyzeData.data?.dataSource !== undefined,
        'T-009: POST /api/products/analyze generates grounded financial opportunity analysis (HTTP 200)'
      );

      // 8. POST /api/products/:id/save - Save to user catalogue
      const saveRes = await fetch(`http://127.0.0.1:${PORT}/api/products/prod_001/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
      });
      const saveData = await saveRes.json();
      assert(
        saveRes.status === 201 && saveData.data?.productId === 'prod_001',
        'T-009: POST /api/products/:id/save saves item to user catalogue with auth (HTTP 201)'
      );

      // 9. POST /api/products/semantic-search - Phase 2 Hugging Face MiniLM
      const semRes = await fetch(`http://127.0.0.1:${PORT}/api/products/semantic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'ergonomic office typing' }),
      });
      const semData = await semRes.json();
      assert(
        semRes.status === 200 &&
          semData.success === true &&
          Array.isArray(semData.data?.results) &&
          semData.data.results.length > 0 &&
          semData.data.results[0].product.title.toLowerCase().includes('keyboard'),
        'Phase 2: POST /api/products/semantic-search ranks products using sentence-transformers (HTTP 200)'
      );

      // 10. GET /api/products/:id/sentiment - Phase 2 Hugging Face RoBERTa
      const sentRes = await fetch(`http://127.0.0.1:${PORT}/api/products/prod_001/sentiment`);
      const sentData = await sentRes.json();
      assert(
        sentRes.status === 200 &&
          sentData.success === true &&
          sentData.data?.sentimentAvailable === true &&
          ['POSITIVE', 'MIXED'].includes(sentData.data?.overallLabel) &&
          sentData.data?.analyzedReviewsCount > 0,
        'Phase 2: GET /api/products/:id/sentiment analyzes customer reviews using RoBERTa (HTTP 200)'
      );

      // 11. GET /api/products/recommendations - Phase 3 Multi-Criteria Opportunity Engine
      const recRes = await fetch(`http://127.0.0.1:${PORT}/api/products/recommendations?limit=5`);
      const recData = await recRes.json();
      assert(
        recRes.status === 200 &&
          recData.success === true &&
          Array.isArray(recData.data?.recommendations) &&
          recData.data.recommendations.length > 0 &&
          recData.data.recommendations[0].opportunityScore !== undefined &&
          recData.data.recommendations[0].scoreBreakdown?.marginContribution !== undefined &&
          recData.data.recommendations[0].scoreBreakdown?.demandContribution !== undefined &&
          recData.data.recommendations[0].scoreBreakdown?.supplierContribution !== undefined &&
          recData.data.recommendations[0].recommendationReason !== undefined &&
          recData.data.recommendations[0].opportunityScore >= recData.data.recommendations[1].opportunityScore,
        'Phase 3: GET /api/products/recommendations ranks products via Multi-Criteria Opportunity Engine (HTTP 200)'
      );

      console.log(`\n----------------------------------------`);
      console.log(` Results: ${passed} passed, ${failed} failed`);
      console.log(`----------------------------------------\n`);
    } catch (err) {
      console.error('Test execution error:', err);
      failed++;
    } finally {
      if (failed > 0) process.exitCode = 1;
      server.close();
    }
  });
};

runProductTests();
