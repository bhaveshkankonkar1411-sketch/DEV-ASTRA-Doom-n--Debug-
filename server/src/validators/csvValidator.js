/**
 * DropPilot AI CSV Validation and Schema Specification
 * Follows PRD FR-012, FR-013, Section 3.9.2 and Section 10.8:
 * - Deterministic schema enforcement
 * - Header aliasing support for common exports (Shopify, WooCommerce, Excel)
 * - Row-level validation and accounting discrepancy detection
 */

export const CSV_SCHEMA = {
  required: [
    { key: 'date', aliases: ['date', 'order_date', 'order date', 'timestamp', 'created_at'], description: 'ISO or YYYY-MM-DD date' },
    { key: 'product_name', aliases: ['product_name', 'product name', 'item', 'product_title', 'product title', 'title'], description: 'Name of the product sold' },
    { key: 'units_sold', aliases: ['units_sold', 'units sold', 'quantity', 'qty', 'units'], description: 'Number of units sold (positive integer)' },
    { key: 'selling_price', aliases: ['selling_price', 'selling price', 'price', 'unit_price', 'unit price', 'retail_price'], description: 'Selling price per unit' },
    { key: 'cogs_per_unit', aliases: ['cogs_per_unit', 'cogs per unit', 'cost_per_unit', 'unit_cost', 'cost', 'cogs'], description: 'Cost of goods sold per unit' },
  ],
  optional: [
    { key: 'order_id', aliases: ['order_id', 'order id', 'order_number', 'order number', 'id'], description: 'Unique external order reference' },
    { key: 'shipping_cost', aliases: ['shipping_cost', 'shipping cost', 'shipping', 'freight'], description: 'Shipping or logistics fee for order' },
    { key: 'platform_fee', aliases: ['platform_fee', 'platform fee', 'fees', 'gateway_fee', 'processing_fee'], description: 'Marketplace or gateway fee' },
    { key: 'ad_spend', aliases: ['ad_spend', 'ad spend', 'ad_cost', 'marketing_cost', 'advertising'], description: 'Marketing / CAC attributed to order' },
    { key: 'other_expenses', aliases: ['other_expenses', 'other expenses', 'misc_cost', 'overhead'], description: 'Miscellaneous costs' },
  ],
};

/**
 * Match a raw header from CSV to normalized schema key
 */
export const normalizeHeader = (rawHeader = '') => {
  const cleaned = rawHeader.trim().toLowerCase().replace(/['"]/g, '');
  for (const field of [...CSV_SCHEMA.required, ...CSV_SCHEMA.optional]) {
    if (field.aliases.includes(cleaned)) {
      return field.key;
    }
  }
  return cleaned;
};

/**
 * Validate CSV column headers against required fields
 */
export const validateHeaders = (headers = []) => {
  const normalized = headers.map(normalizeHeader);
  const missing = [];

  for (const req of CSV_SCHEMA.required) {
    if (!normalized.includes(req.key)) {
      missing.push({
        field: req.key,
        message: `Missing required column: "${req.key}" (accepted: ${req.aliases.join(', ')})`,
      });
    }
  }

  const warnings = [];
  if (!normalized.includes('shipping_cost')) {
    warnings.push('Shipping cost column not detected; shipping will default to 0 unless specified.');
  }
  if (!normalized.includes('ad_spend')) {
    warnings.push('Ad spend column not detected; marketing costs will default to 0.');
  }

  return {
    isValid: missing.length === 0,
    normalizedHeaders: normalized,
    missing,
    warnings,
  };
};

/**
 * Validate a single parsed row
 */
export const validateRow = (row, rowIndex) => {
  const errors = [];
  const normalizedRow = {};

  // Normalize row keys
  for (const [key, val] of Object.entries(row)) {
    const normKey = normalizeHeader(key);
    normalizedRow[normKey] = typeof val === 'string' ? val.trim() : val;
  }

  // 1. Date validation
  if (!normalizedRow.date) {
    errors.push({ row: rowIndex, field: 'date', message: 'Date is required' });
  } else {
    const parsedDate = new Date(normalizedRow.date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ row: rowIndex, field: 'date', message: `Invalid date format: "${normalizedRow.date}"` });
    } else {
      normalizedRow.date = parsedDate;
    }
  }

  // 2. Product Name validation
  if (!normalizedRow.product_name) {
    errors.push({ row: rowIndex, field: 'product_name', message: 'Product name is required' });
  }

  // 3. Units Sold validation
  const units = Number(normalizedRow.units_sold);
  if (isNaN(units) || units <= 0 || !Number.isInteger(units)) {
    errors.push({ row: rowIndex, field: 'units_sold', message: 'Units sold must be a positive whole number' });
  } else {
    normalizedRow.units_sold = units;
  }

  // 4. Selling Price validation
  const price = Number(normalizedRow.selling_price);
  if (isNaN(price) || price < 0) {
    errors.push({ row: rowIndex, field: 'selling_price', message: 'Selling price must be a non-negative number' });
  } else {
    normalizedRow.selling_price = price;
  }

  // 5. COGS validation
  const cogs = Number(normalizedRow.cogs_per_unit);
  if (isNaN(cogs) || cogs < 0) {
    errors.push({ row: rowIndex, field: 'cogs_per_unit', message: 'COGS per unit must be a non-negative number' });
  } else {
    normalizedRow.cogs_per_unit = cogs;
  }

  // Optional numeric fields with safe defaults
  normalizedRow.shipping_cost = normalizedRow.shipping_cost ? Math.max(0, Number(normalizedRow.shipping_cost) || 0) : 0;
  normalizedRow.platform_fee = normalizedRow.platform_fee ? Math.max(0, Number(normalizedRow.platform_fee) || 0) : 0;
  normalizedRow.ad_spend = normalizedRow.ad_spend ? Math.max(0, Number(normalizedRow.ad_spend) || 0) : 0;
  normalizedRow.other_expenses = normalizedRow.other_expenses ? Math.max(0, Number(normalizedRow.other_expenses) || 0) : 0;
  normalizedRow.order_id = normalizedRow.order_id || `ORD-${rowIndex}`;

  // Deterministic calculation for this row
  const rowRevenue = (normalizedRow.units_sold || 0) * (normalizedRow.selling_price || 0);
  const rowCogs = (normalizedRow.units_sold || 0) * (normalizedRow.cogs_per_unit || 0);
  const rowExpenses = normalizedRow.shipping_cost + normalizedRow.platform_fee + normalizedRow.ad_spend + normalizedRow.other_expenses;
  const rowNetProfit = rowRevenue - rowCogs - rowExpenses;

  normalizedRow.computed = {
    revenue: Number(rowRevenue.toFixed(2)),
    cogs: Number(rowCogs.toFixed(2)),
    expenses: Number(rowExpenses.toFixed(2)),
    netProfit: Number(rowNetProfit.toFixed(2)),
  };

  return {
    isValid: errors.length === 0,
    errors,
    data: normalizedRow,
  };
};

export default {
  CSV_SCHEMA,
  normalizeHeader,
  validateHeaders,
  validateRow,
};
