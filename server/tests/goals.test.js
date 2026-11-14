import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import config from '../src/config/environment.js';

const runGoalTests = async () => {
  const PORT = 5093;
  const server = app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(` DropPilot Backend Verification: T-023 Profit Goal API`);
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
        { id: 'usr_goal_tester', email: 'planner@example.com' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      };

      // 1. POST /api/profit-goals - Create goal (PRD Section 10.8)
      const createRes = await fetch(`http://127.0.0.1:${PORT}/api/profit-goals`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          currency: 'INR',
          monthlyNetProfitTarget: 50000,
          month: '2026-11',
        }),
      });
      const createData = await createRes.json();

      assert(
        createRes.status === 201 &&
          createData.success === true &&
          createData.data?.targetProfit === 50000 &&
          createData.data?.currency === 'INR' &&
          Array.isArray(createData.data?.milestones) &&
          createData.data.milestones.length === 4,
        'T-023: POST /api/profit-goals creates monthly target with milestones (HTTP 201)'
      );

      const createdGoalId = createData.data?._id;

      // 2. POST /api/profit-goals - Validation rejects negative or missing target
      const valRes = await fetch(`http://127.0.0.1:${PORT}/api/profit-goals`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          monthlyNetProfitTarget: -500,
        }),
      });
      const valData = await valRes.json();
      assert(
        valRes.status === 400 && valData.error?.code === 'VALIDATION_ERROR',
        'T-023: POST /api/profit-goals rejects negative target (HTTP 400)'
      );

      // 3. GET /api/profit-goals/current - Active goal and pacing
      const currentRes = await fetch(`http://127.0.0.1:${PORT}/api/profit-goals/current`, {
        headers: authHeaders,
      });
      const currentData = await currentRes.json();

      assert(
        currentRes.status === 200 &&
          currentData.success === true &&
          currentData.data?.target > 0 &&
          currentData.data?.currentNetProfit !== undefined &&
          currentData.data?.remainingProfit !== undefined &&
          currentData.data?.progressPercent !== undefined &&
          currentData.data?.status !== undefined,
        'T-023: GET /api/profit-goals/current returns active target, actual net profit, and progress % (HTTP 200)'
      );

      // 4. POST /api/profit-goals/analyze - Reconcile actuals against target (PRD Section 10.8)
      const analyzeRes = await fetch(`http://127.0.0.1:${PORT}/api/profit-goals/analyze`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          goalId: createdGoalId,
          period: '2026-11',
          dataSource: 'csv_import',
        }),
      });
      const analyzeData = await analyzeRes.json();
      const goalPart = analyzeData.data?.goal;
      const finPart = analyzeData.data?.financials;
      const perfPart = analyzeData.data?.productPerformance;

      assert(
        analyzeRes.status === 200 &&
          goalPart?.target === 50000 &&
          goalPart?.currentNetProfit !== undefined &&
          finPart?.revenue !== undefined &&
          finPart?.supplierCosts !== undefined &&
          Array.isArray(perfPart) &&
          analyzeData.data?.calculationBasis === 'backend' &&
          typeof analyzeData.data?.aiSummary === 'string',
        'T-023: POST /api/profit-goals/analyze matches PRD 10.8 format with reconciled financials and product breakdown'
      );

      // 5. GET /api/goals/:id - Retrieve specific goal by ID
      const byIdRes = await fetch(`http://127.0.0.1:${PORT}/api/goals/${createdGoalId}`, {
        headers: authHeaders,
      });
      const byIdData = await byIdRes.json();
      assert(
        byIdRes.status === 200 && (byIdData.data?._id === createdGoalId || byIdData.data?.id === createdGoalId),
        'T-023: GET /api/goals/:id retrieves goal details by ID (HTTP 200)'
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

runGoalTests();

