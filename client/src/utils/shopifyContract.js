export function readShopifyStatus(response) {
  const data = response?.data;
  if (!data || data.store !== 'shopify' ||
      typeof data.connected !== 'boolean' ||
      typeof data.isSimulated !== 'boolean' ||
      typeof data.statusLabel !== 'string' ||
      typeof data.disclosure !== 'string' || !data.disclosure.trim() ||
      (data.shopDomain !== null && typeof data.shopDomain !== 'string')) {
    throw new Error('The server did not return a valid Shopify connection status.');
  }
  return data;
}

export function readShopifySync(response) {
  const data = response?.data;
  if (!data || data.store !== 'shopify' || data.status !== 'synced' ||
      typeof data.externalProductId !== 'string' || !data.externalProductId ||
      typeof data.syncedAt !== 'string' || !Number.isFinite(Date.parse(data.syncedAt)) ||
      typeof data.isSimulated !== 'boolean' ||
      (data.isSimulated && (typeof data.disclosure !== 'string' || !data.disclosure.trim()))) {
    throw new Error('The server did not confirm a Shopify sync result.');
  }
  return data;
}

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export function shopifyProductPayload(product) {
  if (!product?.id || typeof product.name !== 'string' || !product.name.trim() ||
      !Number.isFinite(product.price) || product.price <= 0) {
    throw new Error('Choose a product with a title and positive price to sync.');
  }
  const description = typeof product.features === 'string' && product.features.trim()
    ? product.features
    : product.name;
  return {
    productId: product.id,
    listing: {
      title: product.name,
      descriptionHtml: `<p>${description.split(/\r?\n/).map(escapeHtml).join('<br>')}</p>`,
      price: product.price.toFixed(2),
      currency: 'INR',
    },
    mode: 'create',
  };
}
