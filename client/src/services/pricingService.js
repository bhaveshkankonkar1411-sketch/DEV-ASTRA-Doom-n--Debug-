import apiClient from './api';

export const pricingService = {
  calculatePrice: async (payload, { signal } = {}) => apiClient('/pricing/calculate', { method: 'POST', body: JSON.stringify(payload), signal }),
};

export default pricingService;

