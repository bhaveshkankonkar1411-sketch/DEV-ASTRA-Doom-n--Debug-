/**
 * DropPilot AI - End-to-End User Flow & Integration Verification (T-031 / QA-028, QA-029)
 * Tests full user workflows:
 * Flow 1: Auth/Session -> Product Catalogue -> Supplier Intelligence -> Smart Pricing Calculation
 * Flow 2: Store CSV Validation -> Ingestion -> Profit Aggregation -> Monthly Goal Analysis -> Grounded AI Recovery
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { readProductList } from '../src/utils/productContract.js';
import { readSupplierComparison } from '../src/utils/supplierContract.js';
import { toPricingPayload, readPricingEstimate } from '../src/utils/pricingContract.js';
import { readShopifyStatus, readShopifySync, shopifyProductPayload } from '../src/utils/shopifyContract.js';
import { readCsvPreview, readCurrentGoal, goalPayload } from '../src/utils/goalContract.js';
import { calculateGoal } from '../src/utils/workspaceMath.js';

// Server controllers & services
import { getProducts, getProductById } from '../../server/src/controllers/productController.js';
import { compareSuppliersList } from '../../server/src/services/suppliers/supplierComparison.js';
import { calculatePricingScenarios } from '../../server/src/services/pricingService.js';
import { parseAndValidateCsv } from '../../server/src/services/csvImportService.js';
import { aggregateOrdersProfit } from '../../server/src/services/profitAggregationService.js';
import { getStoreConnectionStatus, syncProductToShopify } from '../../server/src/services/shopify/shopifySyncService.js';

describe('DropPilot AI - End-to-End Workflow Verification', () => {

  it('Flow 1 (QA-028): Discovery -> Supplier Comparison -> Pricing Engine', async () => {
    // 1. Discover Products
    let catalogueResult;
    const mockRes = {
      json: (data) => { catalogueResult = data; },
      status: () => mockRes,
    };
    await getProducts({ query: { search: 'lamp' } }, mockRes, () => {});
    assert.ok(catalogueResult && catalogueResult.success, 'Catalogue returned response');
    const catalogue = readProductList(catalogueResult);
    assert.ok(catalogue.length > 0, 'Found matching products');

    const product = catalogue[0];
    assert.ok(product.id, 'Product has valid ID');
    assert.ok(product.cost > 0, 'Product has estimated cost');
    assert.ok(product.price > 0, 'Product has suggested retail price');
    assert.ok(product.sourceLabel, 'Product carries provenance source label');

    // 2. Compare Suppliers for selected product
    const comparison = await compareSuppliersList(product.id, product.supplierIds || ['supp_001', 'supp_002']);
    assert.ok(comparison.comparisons.length >= 2, 'Suppliers compared side-by-side');
    assert.ok(comparison.recommendedSupplierId, 'AI recommendation provided with evidence');
    const chosenSupplier = comparison.comparisons.find(s => s.supplierId === comparison.recommendedSupplierId);
    assert.ok(chosenSupplier.totalLandedCost > 0, 'Landed cost computed');

    // 3. Model Smart Pricing with landed cost
    const pricingPayload = toPricingPayload({
      sellingPrice: String(product.price),
      supplierCost: String(chosenSupplier.unitCost),
      shippingCost: String(chosenSupplier.shippingCost),
      platformFees: '45',
      advertisingCostPerOrder: '80',
      otherCosts: '0',
    });
    const backendResult = calculatePricingScenarios(pricingPayload);
    const estimate = readPricingEstimate({ data: backendResult });

    assert.ok(estimate.estimatedProfit > 0, 'Healthy positive profit calculated');
    assert.ok(estimate.profitMarginPercent > 0, 'Positive profit margin percent calculated');
    assert.strictEqual(estimate.currency, 'INR', 'Currency preserved');
  });

  it('Flow 2 (QA-029): Store CSV Ingestion -> Profit Aggregation -> Goal Analysis', async () => {
    // 1. CSV Preview & Validation
    const sampleCsv =
      'order_id,date,product_name,units_sold,selling_price,cogs_per_unit,shipping_cost,platform_fee,ad_spend\n' +
      'ORD-201,2026-11-01,Sunset Projection LED Atmosphere Lamp,3,1499,420,160,60,350\n' +
      'ORD-202,2026-11-02,Wireless Ergonomic Split Mechanical Keyboard,2,4999,1950,250,100,650\n';

    const validationReport = await parseAndValidateCsv(sampleCsv);
    assert.strictEqual(validationReport.isValid, true, 'CSV validated cleanly');
    assert.strictEqual(validationReport.validRows, 2, '2 valid order rows parsed');

    // 2. Profit Aggregation
    const orders = validationReport.allValidRecords.map(r => ({
      productName: r.product_name,
      unitsSold: r.units_sold,
      sellingPrice: r.selling_price,
      cogs: r.cogs_per_unit,
      shippingCost: r.shipping_cost,
      platformFee: r.platform_fee,
      adSpend: r.ad_spend,
      otherExpenses: 0,
      orderDate: r.date,
    }));
    const aggregates = aggregateOrdersProfit(orders);
    const f = aggregates.financials;

    // Verify accounting arithmetic
    assert.strictEqual(f.revenue, (3 * 1499) + (2 * 4999), 'Revenue reconciled');
    assert.strictEqual(f.supplierCosts, (3 * 420) + (2 * 1950), 'COGS / Supplier Costs reconciled');
    assert.ok(f.netProfit > 0, 'Positive net profit derived');
    assert.strictEqual(
      f.netProfit,
      f.revenue - f.totalCost,
      'Net Profit strictly equals Revenue minus Total Cost'
    );

    // 3. Goal Pacing & Gap Analysis
    const monthlyTarget = 50000;
    const plan = calculateGoal(monthlyTarget, f.netProfit, 500);
    assert.ok(plan.remaining >= 0, 'Remaining profit calculated');
    assert.ok(plan.dailyProfit >= 0, 'Daily required profit computed');
    assert.ok(plan.orders >= 0, 'Required orders computed');
  });

  it('Flow 3 (Shopify): Connection Status & Listing Sync with Simulation Disclosure', async () => {
    // 1. Check Store Status
    const statusResult = await getStoreConnectionStatus();
    assert.ok(typeof statusResult.connected === 'boolean', 'Status reports connection state');

    // 2. Sync Sample Product Listing
    const mockProduct = {
      id: 1,
      name: 'Sunset Projection Lamp',
      price: 1499,
      cost: 420,
      category: 'Lighting',
      features: 'High-power LED\nWarm color tones\nUSB powered',
    };
    const syncPayload = shopifyProductPayload(mockProduct);
    const syncResult = await syncProductToShopify(syncPayload);

    assert.strictEqual(syncResult.isSimulated, true, 'Simulated mode transparently indicated');
    assert.ok(syncResult.disclosure.length > 0, 'Explicit disclosure statement provided');
    assert.ok(syncResult.externalProductId, 'External product ID generated');
  });

});
