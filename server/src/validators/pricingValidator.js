/**
 * Validation rules for POST /api/pricing/calculate per PRD Section 10.5
 */
export const validatePricingCalculation = (data) => {
  const errors = [];

  if (data.sellingPrice == null || typeof data.sellingPrice !== 'number' || isNaN(data.sellingPrice) || data.sellingPrice < 0) {
    errors.push({ field: 'sellingPrice', message: 'Selling price must be a non-negative number' });
  }

  if (data.supplierCost == null || typeof data.supplierCost !== 'number' || isNaN(data.supplierCost) || data.supplierCost < 0) {
    errors.push({ field: 'supplierCost', message: 'Supplier cost must be a non-negative number' });
  }

  if (data.shippingCost != null && (typeof data.shippingCost !== 'number' || data.shippingCost < 0)) {
    errors.push({ field: 'shippingCost', message: 'Shipping cost must be a non-negative number' });
  }

  if (data.platformFees != null && (typeof data.platformFees !== 'number' || data.platformFees < 0)) {
    errors.push({ field: 'platformFees', message: 'Platform fees must be a non-negative number' });
  }

  if (data.advertisingCostPerOrder != null && (typeof data.advertisingCostPerOrder !== 'number' || data.advertisingCostPerOrder < 0)) {
    errors.push({ field: 'advertisingCostPerOrder', message: 'Advertising cost must be a non-negative number' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default validatePricingCalculation;
