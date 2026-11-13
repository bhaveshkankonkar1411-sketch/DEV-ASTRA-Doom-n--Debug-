import app from '../src/app.js';

const runCsvTests = async () => {
  const PORT = 5095;
  const server = app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(` DropPilot Backend Verification: T-021 CSV Schema & Validation`);
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
      // 1. GET /api/goals/csv/schema
      const schemaRes = await fetch(`http://127.0.0.1:${PORT}/api/goals/csv/schema`);
      const schemaData = await schemaRes.json();
      assert(
        schemaRes.status === 200 &&
          schemaData.data?.schema?.required?.length >= 5 &&
          typeof schemaData.data?.sampleCsvTemplate === 'string',
        'T-021: GET /api/goals/csv/schema returns column definitions and sample template (HTTP 200)'
      );

      // 2. POST /api/goals/csv/preview - Valid CSV data & calculation check
      const validCsv =
        'date,product_name,units_sold,selling_price,cogs_per_unit,shipping_cost,platform_fee,ad_spend\n' +
        '2026-11-01,Sunset Projection LED Atmosphere Lamp,2,1499,420,160,60,350\n' +
        '2026-11-03,Wireless Ergonomic Split Mechanical Keyboard,1,4999,1950,250,100,650\n';

      const previewRes = await fetch(`http://127.0.0.1:${PORT}/api/goals/csv/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: validCsv }),
      });
      const previewData = await previewRes.json();

      assert(
        previewRes.status === 200 &&
          previewData.data?.isValid === true &&
          previewData.data?.validRows === 2 &&
          previewData.data?.invalidRows === 0 &&
          previewData.data?.preview?.length === 2,
        'T-021: POST /api/goals/csv/preview parses valid CSV and reports 2 valid rows'
      );

      // Verify mathematical accuracy of preview row 1:
      // Rev = 2 * 1499 = 2998, Cogs = 2 * 420 = 840, Expenses = 160 + 60 + 350 = 570, NetProfit = 2998 - 840 - 570 = 1588
      const row1 = previewData.data?.preview[0];
      assert(
        row1?.computed?.revenue === 2998 &&
          row1?.computed?.cogs === 840 &&
          row1?.computed?.expenses === 570 &&
          row1?.computed?.netProfit === 1588,
        'T-021: CSV row calculation matches deterministic formula (Revenue: 2998, COGS: 840, Net: 1588)'
      );

      // 3. POST /api/goals/csv/preview - Header validation failure (missing required columns)
      const missingHeadersCsv = 'date,product_name\n2026-11-01,Test Product\n';
      const missingRes = await fetch(`http://127.0.0.1:${PORT}/api/goals/csv/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: missingHeadersCsv }),
      });
      const missingData = await missingRes.json();
      assert(
        missingRes.status === 200 &&
          missingData.data?.isValid === false &&
          missingData.data?.errors?.length >= 3,
        'T-021: Rejects CSV missing required columns (units_sold, selling_price, cogs_per_unit)'
      );

      // 4. POST /api/goals/csv/preview - Row-level data validation (invalid dates, negative values)
      const invalidRowCsv =
        'date,product_name,units_sold,selling_price,cogs_per_unit\n' +
        'not-a-date,Broken Product,-2,500,-100\n';

      const invalidRowRes = await fetch(`http://127.0.0.1:${PORT}/api/goals/csv/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: invalidRowCsv }),
      });
      const invalidRowData = await invalidRowRes.json();
      assert(
        invalidRowRes.status === 200 &&
          invalidRowData.data?.isValid === false &&
          invalidRowData.data?.invalidRows === 1 &&
          invalidRowData.data?.errors?.length >= 3,
        'T-021: Flags row errors for invalid date, negative units, and negative COGS'
      );

      // 5. POST /api/goals/csv/preview - Missing expense disclosures & warnings
      const noExpensesCsv =
        'date,product_name,units_sold,selling_price,cogs_per_unit\n' +
        '2026-11-01,Valid Product,1,1000,500\n';
      const noExpRes = await fetch(`http://127.0.0.1:${PORT}/api/goals/csv/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: noExpensesCsv }),
      });
      const noExpData = await noExpRes.json();
      assert(
        noExpRes.status === 200 &&
          noExpData.data?.warnings?.length > 0,
        'T-021: Generates transparent warnings for missing expense columns per PRD rules'
      );

      // 6. POST /api/profit-goals/import-csv - End-to-end import route alias
      const importRes = await fetch(`http://127.0.0.1:${PORT}/api/profit-goals/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: validCsv }),
      });
      const importData = await importRes.json();
      assert(
        importRes.status === 201 &&
          importData.data?.recordCount === 2 &&
          importData.data?.aggregates?.totalRevenue > 0,
        'T-021: POST /api/profit-goals/import-csv ingests rows and returns aggregated totals (HTTP 201)'
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

runCsvTests();

