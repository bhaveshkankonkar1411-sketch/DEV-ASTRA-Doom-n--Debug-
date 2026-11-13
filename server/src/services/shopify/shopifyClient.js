/**
 * Shopify Admin API Client & Readiness Checker (T-026)
 * PRD Section 3.5, 10.6, and Demo Integrity Rules.
 */

import config from '../../config/environment.js';

export const isShopifyConfigured = () => {
  return Boolean(
    config.shopify?.clientId &&
    config.shopify?.clientSecret &&
    config.shopify?.clientId !== 'your_shopify_client_id_placeholder'
  );
};

export const getShopifyClient = (shopDomain, accessToken) => {
  const isReal = isShopifyConfigured() && Boolean(shopDomain && accessToken);

  return {
    shopDomain: shopDomain || 'demo-store.myshopify.com',
    accessToken: accessToken || null,
    isReal,
    apiVersion: '2024-07',
  };
};

export default {
  isShopifyConfigured,
  getShopifyClient,
};
