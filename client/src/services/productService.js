import apiClient from './api';

export const productService = {
  getProducts: async (params = {}, options = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/products${query ? `?${query}` : ''}`, { ...options, method: 'GET' });
  },
  getProductById: async (id) => apiClient(`/products/${id}`, { method: 'GET' }),
  analyzeProduct: async (id) => apiClient(`/products/${id}/analyze`, { method: 'POST' }),
  semanticSearch: async (query, options = {}) => apiClient('/products/semantic-search', { ...options, method: 'POST', body: JSON.stringify({ query }) }),
  getSentiment: async (id, options = {}) => apiClient(`/products/${id}/sentiment`, { ...options, method: 'GET' }),
  getRecommendations: async (params = {}, options = {}) => apiClient('/products/recommendations', { ...options, method: 'POST', body: JSON.stringify(params) }),
};

export default productService;

