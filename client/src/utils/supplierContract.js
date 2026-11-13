export function readSupplierComparison(response) {
  const data = response?.data;
  if (!data || !Array.isArray(data.comparisons) ||
      !(data.recommendedSupplierId === null || typeof data.recommendedSupplierId === 'string') ||
      typeof data.recommendationReason !== 'string') {
    throw new Error('The server did not return a valid supplier comparison.');
  }
  for (const supplier of data.comparisons) {
    if (!supplier?.supplierId || typeof supplier.name !== 'string' ||
        !['unitCost', 'shippingCost', 'totalLandedCost', 'rating', 'fulfillmentRate'].every(key => Number.isFinite(supplier[key])) ||
        typeof supplier.estimatedShippingDays !== 'string' ||
        typeof supplier.trustBadge !== 'string' ||
        typeof supplier.verified !== 'boolean' ||
        typeof supplier.sourceLabel !== 'string' ||
        !Array.isArray(supplier.evidence)) {
      throw new Error('The server returned an invalid supplier comparison row.');
    }
  }
  return data;
}
