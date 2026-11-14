import app from '../src/app.js';

const runTests = async () => {
  const PORT = 5098;
  const server = app.listen(PORT, async () => {
    console.log(`\n========================================`);
    console.log(` DropPilot Backend Verification: T-004 & T-007`);
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
      // 1. T-004: Health Check
      const healthRes = await fetch(`http://127.0.0.1:${PORT}/health`);
      const healthData = await healthRes.json();
      assert(healthRes.status === 200 && healthData.status === 'ok', 'T-004: GET /health returns HTTP 200 with status ok');

      // 2. T-007: Validation failure on register
      const valRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const valData = await valRes.json();
      assert(valRes.status === 400 && valData.error?.code === 'VALIDATION_ERROR', 'T-007: POST /api/auth/register validates required fields (HTTP 400)');

      // 3. T-007: Successful user registration
      const testEmail = `seller_${Date.now()}@example.com`;
      const regRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Demo Seller',
          email: testEmail,
          password: 'Password123!',
        }),
      });
      const regData = await regRes.json();
      assert(
        regRes.status === 201 && regData.success === true && !!regData.data?.token && regData.data?.user?.email === testEmail,
        'T-007: POST /api/auth/register creates user and returns JWT token (HTTP 201)'
      );
      const token = regData.data?.token;

      // 4. T-007: Duplicate user registration failure
      const dupRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Demo Duplicate',
          email: testEmail,
          password: 'Password123!',
        }),
      });
      const dupData = await dupRes.json();
      assert(dupRes.status === 409 && dupData.error?.code === 'EMAIL_ALREADY_EXISTS', 'T-007: POST /api/auth/register prevents duplicate email (HTTP 409)');

      // 5. T-007: Login with wrong password
      const wrongPwRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword!',
        }),
      });
      assert(wrongPwRes.status === 401, 'T-007: POST /api/auth/login rejects incorrect password (HTTP 401)');

      // 6. T-007: Login with correct credentials
      const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'Password123!',
        }),
      });
      const loginData = await loginRes.json();
      assert(loginRes.status === 200 && !!loginData.data?.token, 'T-007: POST /api/auth/login authenticates and returns JWT (HTTP 200)');

      // 7. T-007: Protected route without token
      const noAuthRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`);
      assert(noAuthRes.status === 401, 'T-007: GET /api/auth/me rejects unauthenticated request (HTTP 401)');

      // 8. T-007: Protected route with invalid token
      const badTokenRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`, {
        headers: { Authorization: 'Bearer invalid.token.value' },
      });
      assert(badTokenRes.status === 403, 'T-007: GET /api/auth/me rejects invalid token (HTTP 403)');

      // 9. T-007: Protected route with valid token
      const authMeRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const authMeData = await authMeRes.json();
      assert(
        authMeRes.status === 200 &&
          authMeData.data?.user?.email === testEmail &&
          authMeData.data?.user?.passwordHash === undefined,
        'T-007: GET /api/auth/me returns current user profile safely without passwordHash (HTTP 200)'
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

runTests();

