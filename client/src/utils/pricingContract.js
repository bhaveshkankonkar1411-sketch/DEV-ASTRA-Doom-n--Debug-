export const pricingFields = {
  sellingPrice: 'Selling price',
  supplierCost: 'Product cost',
  shippingCost: 'Shipping',
  platformFees: 'Platform & payment fees',
  advertisingCostPerOrder: 'Ad cost per order',
  otherCosts: 'Other costs',
};

// The API contract uses integer paise. Keep editable strings until validation
// so clearing a field never silently becomes a zero-cost calculation.
export function toPricingPayload(inputs) {
  const payload = { currency: 'INR' };
  for (const [field, label] of Object.entries(pricingFields)) {
    const value = String(inputs[field] ?? '').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
      throw new Error(`${label} must be a non-negative amount with at most two decimal places.`);
    }
    const [whole, fraction = ''] = value.split('.');
    const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(paise) || paise > 100000000000) {
      throw new Error(`${label} must not exceed ₹1,00,00,00,000.`);
    }
    payload[field] = paise;
  }
  return payload;
}

export function readPricingEstimate(response) {
  const result = response?.data;
  if (response?.success === false || !result || result.currency !== 'INR' ||
      result.calculationBasis !== 'backend' || result.isEstimate !== true ||
      !['totalCost', 'estimatedProfit', 'profitMarginPercent'].every(key => Number.isFinite(result[key]))) {
    throw new Error('The pricing server returned an incompatible result. Run the updated backend pricing endpoint and retry.');
  }
  return result;
}

export const formatPaise = amount => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(amount / 100);
