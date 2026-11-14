import { formatSuccess, formatError } from '../utils/responseFormatter.js';
import { calculatePricingScenarios } from '../services/pricingService.js';
import { validatePricingCalculation } from '../validators/pricingValidator.js';

export const calculatePrice = async (req, res, next) => {
  try {
    const { isValid, errors } = validatePricingCalculation(req.body);
    if (!isValid) {
      return res.status(400).json(formatError('Validation error', 'VALIDATION_ERROR', errors));
    }

    const metrics = calculatePricingScenarios(req.body);
    return res.json(formatSuccess(metrics, 'Price calculation completed'));
  } catch (err) {
    next(err);
  }
};

export default {
  calculatePrice,
};
