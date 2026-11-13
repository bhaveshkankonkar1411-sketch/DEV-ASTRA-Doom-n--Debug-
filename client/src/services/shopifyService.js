import apiClient from './api';

export const shopifyService = {
  connectStore: async (credentials) => apiClient('/shopify/connect', { method: 'POST', body: JSON.stringify(credentials) }),
  syncProducts: async (payload) => apiClient('/shopify/sync', { method: 'POST', body: JSON.stringify(payload) }),
  getStoreProducts: async () => apiClient('/shopify/products', { method: 'GET' }),
};

export default shopifyService;

