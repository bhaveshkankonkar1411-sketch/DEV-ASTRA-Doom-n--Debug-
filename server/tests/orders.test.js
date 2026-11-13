import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import config from '../src/config/environment.js';

const runOrderTests = async () => {
  const PORT = 5094;
  const server = app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(` DropPilot Backend Verification: T-022 Order & Profit Aggregation API`);
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
        { id: 'usr_seller_456', email: 'seller@example.com' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      };

      // 1. GET /api/orders - List orders
      const listRes = await fetch(`http://127.0.0.1:${PORT}/api/orders`, {
        headers: authHeaders,
      });
      const listData = await listRes.json();
      assert(
        listRes.status === 200 &&
          listData.success === true &&
          Array.isArray(listData.data?.orders) &&
          listData.data.orders.length > 0,
        'T-022: GET /api/orders returns paginated order list (HTTP 200)'
      );

      // 2. GET /api/orders/metrics - Aggregated profit metrics & product performance
      const metricsRes = await fetch(`http://127.0.0.1:${PORT}/api/orders/metrics`, {
        headers: authHeaders,
      });
      const metricsData = await metricsRes.json();
      const financials = metricsData.data?.financials;
      const products = metricsData.data?.productPerformance;

      assert(
        metricsRes.status === 200 &&
          financials?.revenue > 0 &&
          financials?.supplierCosts > 0 &&
          financials?.netProfit > 0 &&
          financials?.profitMarginPercent > 0,
        'T-022: GET /api/orders/metrics calculates deterministic store financials (Revenue, COGS, Net Profit, Margin %)'
      );

      assert(
        Array.isArray(products) &&
          products.length > 0 &&
          products[0].productName &&
          products[0].netProfit !== undefined &&
          products[0].profitMarginPercent !== undefined,
        'T-022: Aggregates product-level performance with margin % and profit attribution'
      );

      // Verify sorting: first product has highest net profit
      if (products.length > 1) {
        assert(
          products[0].netProfit >= products[1].netProfit,
          'T-022: Product performance is correctly ranked by net profit descending'
        );
      }

      // 3. GET /api/orders/:orderId - Detail lookup
      const detailRes = await fetch(`http://127.0.0.1:${PORT}/api/orders/ORD-1001`, {
        headers: authHeaders,
      });
      const detailData = await detailRes.json();
      assert(
        detailRes.status === 200 && detailData.data?.externalOrderId === 'ORD-1001',
        'T-022: GET /api/orders/:orderId retrieves single order by order reference (HTTP 200)'
      );

      // 4. PATCH /api/orders/:orderId/status - Status update
      const patchRes = await fetch(`http://127.0.0.1:${PORT}/api/orders/ORD-1001/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'SHIPPED' }),
      });
      const patchData = await patchRes.json();
      assert(
        patchRes.status === 200 && patchData.data?.status === 'SHIPPED',
        'T-022: PATCH /api/orders/:orderId/status updates fulfillment status (HTTP 200)'
      );

      // 5. POST /api/orders/import-csv - Ingest CSV and update metrics
      const newOrdersCsv =
        'date,product_name,units_sold,selling_price,cogs_per_unit,shipping_cost,platform_fee,ad_spend\n' +
        '2026-11-10,Sunset Projection LED Atmosphere Lamp,5,1499,420,400,150,800\n';

      const importRes = await fetch(`http://127.0.0.1:${PORT}/api/orders/import-csv`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ csvData: newOrdersCsv }),
      });
      const importData = await importRes.json();

      assert(
        importRes.status === 201 &&
          importData.data?.importedCount === 1 &&
          importData.data?.metrics?.financials?.revenue === 7495, // 5 * 1499 = 7495
        'T-022: POST /api/orders/import-csv persists new orders and recalculates profit aggregates (HTTP 201)'
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

runOrderTests();

