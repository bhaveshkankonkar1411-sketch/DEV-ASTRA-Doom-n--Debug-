import { formatSuccess } from '../utils/responseFormatter.js';
import { pushListingToShopify } from '../services/shopify/shopifySyncService.js';

export const connectStore = async (req, res, next) => {
  try {
    res.json(formatSuccess({ connected: true }, 'Shopify store connected'));
  } catch (err) {
    next(err);
  }
};

export const handleCallback = async (req, res, next) => {
  try {
    res.redirect('/');
  } catch (err) {
    next(err);
  }
};

export const syncProducts = async (req, res, next) => {
  try {
    const result = await pushListingToShopify(null, req.body);
    res.json(formatSuccess(result, 'Products synchronized with Shopify'));
  } catch (err) {
    next(err);
  }
};

export const getStoreProducts = async (req, res, next) => {
  try {
    res.json(formatSuccess([], 'Shopify products retrieved'));
  } catch (err) {
    next(err);
  }
};

