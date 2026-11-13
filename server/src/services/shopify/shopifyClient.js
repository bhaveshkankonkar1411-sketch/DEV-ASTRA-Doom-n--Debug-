import config from '../../config/environment.js';

// Shopify Admin API client placeholder
export const getShopifyClient = (shopDomain, accessToken) => {
  return {
    shopDomain,
    accessToken,
  };
};

export default getShopifyClient;

