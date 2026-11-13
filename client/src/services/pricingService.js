import apiClient from './api';

export const pricingService = {
  calculatePrice: async (payload) => apiClient('/pricing/calculate', { method: 'POST', body: JSON.stringify(payload) }),
};

export default pricingService;

