import apiClient from './api';

export const orderService = {
  getOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/orders${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  importCsv: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/orders/import-csv', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return response.json();
  },
};

export default orderService;

