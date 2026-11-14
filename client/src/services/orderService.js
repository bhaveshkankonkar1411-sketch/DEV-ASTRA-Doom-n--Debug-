import apiClient from './api';

export const orderService = {
  getOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/orders${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  importCsv: async (formData) => apiClient('/orders/import-csv', { method: 'POST', body: formData }),
};

export default orderService;

