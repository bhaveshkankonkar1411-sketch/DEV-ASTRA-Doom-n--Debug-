import { formatSuccess } from '../utils/responseFormatter.js';

export const getProducts = async (req, res, next) => {
  try {
    res.json(formatSuccess([], 'Products retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    res.json(formatSuccess({ id: req.params.id }, 'Product details retrieved'));
  } catch (err) {
    next(err);
  }
};

export const analyzeProduct = async (req, res, next) => {
  try {
    res.json(formatSuccess({ id: req.params.id, analysis: 'Analysis placeholder' }, 'Product analyzed'));
  } catch (err) {
    next(err);
  }
};

