import apiClient from './api';

export const analyticsService = {
  getSummary: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/analytics/summary${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getCharts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/analytics/charts${query ? `?${query}` : ''}`, { method: 'GET' });
  },
};

export default analyticsService;

