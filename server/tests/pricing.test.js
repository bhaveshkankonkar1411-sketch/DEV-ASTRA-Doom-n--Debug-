import app from '../src/app.js';

const runPricingTests = async () => {
  const PORT = 5096;
  const server = app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(` DropPilot Backend Verification: T-017 Pricing API`);
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
      // 1. Exact PRD Section 10.5 Example
      const prdRes = await fetch(`http://127.0.0.1:${PORT}/api/pricing/calculate`, {
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
      const prdData = await prdRes.json();
      assert(
        prdRes.status === 200 &&
          prdData.data?.totalCost === 65000 &&
          prdData.data?.estimatedProfit === 34900 &&
          prdData.data?.profitMarginPercent === 34.93 &&
          prdData.data?.calculationBasis === 'backend' &&
          prdData.data?.isEstimate === true,
        'T-017: Exact PRD Section 10.5 test case matches deterministic output (totalCost: 65000, profit: 34900, margin: 34.93%)'
      );

      // 2. Break-even scenario
      const breakEvenRes = await fetch(`http://127.0.0.1:${PORT}/api/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'INR',
          sellingPrice: 1000,
          supplierCost: 700,
          shippingCost: 100,
          platformFees: 50,
          advertisingCostPerOrder: 150,
        }),
      });
      const breakEvenData = await breakEvenRes.json();
      assert(
        breakEvenRes.status === 200 &&
          breakEvenData.data?.totalCost === 1000 &&
          breakEvenData.data?.estimatedProfit === 0 &&
          breakEvenData.data?.profitMarginPercent === 0,
        'T-017: Break-even pricing calculation yields 0 profit and 0% margin'
      );

      // 3. Loss scenario
      const lossRes = await fetch(`http://127.0.0.1:${PORT}/api/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'INR',
          sellingPrice: 500,
          supplierCost: 400,
          shippingCost: 100,
          platformFees: 50,
          advertisingCostPerOrder: 100,
        }),
      });
      const lossData = await lossRes.json();
      assert(
        lossRes.status === 200 &&
          lossData.data?.totalCost === 650 &&
          lossData.data?.estimatedProfit === -150 &&
          lossData.data?.profitMarginPercent === -30,
        'T-017: Loss scenario correctly reports negative profit (-150) and negative margin (-30%)'
      );

      // 4. Validation - missing sellingPrice
      const val1Res = await fetch(`http://127.0.0.1:${PORT}/api/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierCost: 500,
        }),
      });
      const val1Data = await val1Res.json();
      assert(
        val1Res.status === 400 && val1Data.error?.code === 'VALIDATION_ERROR',
        'T-017: Validation rejects missing sellingPrice (HTTP 400)'
      );

      // 5. Validation - negative values rejected
      const val2Res = await fetch(`http://127.0.0.1:${PORT}/api/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellingPrice: 1000,
          supplierCost: -50,
        }),
      });
      const val2Data = await val2Res.json();
      assert(
        val2Res.status === 400 && val2Data.error?.code === 'VALIDATION_ERROR',
        'T-017: Validation rejects negative costs (HTTP 400)'
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

runPricingTests();
