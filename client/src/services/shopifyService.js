import apiClient from './api';

export const shopifyService = {
  getStatus: async () => apiClient('/shopify/status', { method: 'GET' }),
  connectStore: async (credentials) => apiClient('/shopify/connect', { method: 'POST', body: JSON.stringify(credentials) }),
  disconnectStore: async () => apiClient('/shopify/disconnect', { method: 'DELETE' }),
  syncProduct: async (payload) => apiClient('/shopify/sync', { method: 'POST', body: JSON.stringify(payload) }),
  getStoreProducts: async () => apiClient('/shopify/products', { method: 'GET' }),
};

export default shopifyService;

