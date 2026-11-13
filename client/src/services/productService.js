import apiClient from './api';

export const productService = {
  getProducts: async (params = {}, options = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/products${query ? `?${query}` : ''}`, { ...options, method: 'GET' });
  },
  getProductById: async (id) => apiClient(`/products/${id}`, { method: 'GET' }),
  analyzeProduct: async (id) => apiClient(`/products/${id}/analyze`, { method: 'POST' }),
};

export default productService;

