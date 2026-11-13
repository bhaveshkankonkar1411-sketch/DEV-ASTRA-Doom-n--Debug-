import apiClient from './api';

export const supplierService = {
  getSuppliers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/suppliers${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  compareSuppliers: async (payload) => apiClient('/suppliers/compare', { method: 'POST', body: JSON.stringify(payload) }),
  getSupplierById: async (id) => apiClient(`/suppliers/${id}`, { method: 'GET' }),
};

export default supplierService;

