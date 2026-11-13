export function normalizeProduct(product) {
  const id = product?.id || product?._id || product?.sku;
  const name = product?.title;
  const cost = product?.estimatedCost;
  const price = product?.suggestedRetailPrice;
  const score = product?.demandScore;
  if (!id || typeof name !== 'string' || !name.trim() ||
      typeof product.category !== 'string' || !product.category.trim() ||
      !Number.isFinite(cost) || cost < 0 ||
      !Number.isFinite(price) || price <= 0 ||
      !Number.isFinite(score) ||
      typeof product.sourceLabel !== 'string' || !product.sourceLabel.trim()) {
    throw new Error('The product catalogue returned an invalid product record.');
  }

  const supplierIds = Array.isArray(product.supplierIds) ? product.supplierIds : [];
  const suppliers = Array.isArray(product.suppliers) ? product.suppliers : [];
  const trend = {
    RISING: 'Rising',
    STABLE: 'Steady',
    FALLING: 'Declining',
  }[product.trendVelocity] || 'Trend unavailable';
  return {
    ...product,
    id: String(id),
    name: name.trim(),
    category: product.category,
    cost,
    price,
    score,
    trend,
    icon: 'box',
    color: 'violet',
    features: typeof product.description === 'string' ? product.description : '',
    sourceLabel: product.sourceLabel,
    supplierIds,
    suppliers,
  };
}

export function readProductList(response) {
  if (!Array.isArray(response?.data?.products)) {
    throw new Error('The server did not return a product catalogue.');
  }
  return response.data.products.map(normalizeProduct);
}
