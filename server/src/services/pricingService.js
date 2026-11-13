import { calculateProductPricing } from '../utils/financialCalculator.js';

export const calculatePricingScenarios = (params) => {
  return calculateProductPricing(params);
};

export default {
  calculatePricingScenarios,
};
