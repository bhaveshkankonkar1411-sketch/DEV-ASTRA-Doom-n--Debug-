import { formatSuccess } from '../utils/responseFormatter.js';
import { calculatePricingScenarios } from '../services/pricingService.js';

export const calculatePrice = async (req, res, next) => {
  try {
    const metrics = calculatePricingScenarios(req.body);
    res.json(formatSuccess(metrics, 'Price calculation completed'));
  } catch (err) {
    next(err);
  }
};

