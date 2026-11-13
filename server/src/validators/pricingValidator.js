// Pricing validation rules placeholder

export const validatePricingCalculation = (data) => {
  const errors = [];
  if (data.sellingPrice == null || data.sellingPrice < 0) errors.push({ field: 'sellingPrice', message: 'Valid selling price required' });
  if (data.supplierCost == null || data.supplierCost < 0) errors.push({ field: 'supplierCost', message: 'Valid supplier cost required' });
  return { isValid: errors.length === 0, errors };
};

