# T-018: Live Profit & Price Slider

The active Smart Pricing view uses `SmartPricingPage.jsx` and calls the existing
`pricingService.calculatePrice` endpoint. Input values are rupees; request and
response monetary amounts use integer paise per PRD 10.5.

The UI includes every cost input, zero-price support, two-decimal validation,
debounced requests, cancellation, stale-response protection, a ten-second timeout,
retry, and explicit INR/Estimate/calculation-basis labels. No local calculation
is substituted when the server fails.

Run from `client`:

```text
node --test tests/pricingContract.test.mjs tests/workspaceMath.test.mjs
npm run build
```

The contract tests load the actual pricing controller and its dependencies from
the fetched `origin/feature/backend-api` ref, without modifying server files.
They verify the PRD example, decimals, all costs, losses, zero, invalid input,
and rejection of the previous response shape.

Deployment prerequisite: integrate/run Member 2's updated backend. Fetch alone
does not update the server files on `feature/frontend-app`. The frontend displays
an actionable error if connected to the old endpoint. The tests exercise the
controller directly; browser and deployed HTTP verification remain separate.
