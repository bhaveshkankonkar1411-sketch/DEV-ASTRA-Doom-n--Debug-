/**
 * Shopify Controller (T-026)
 * Handles store connection, status checks, and product catalog synchronization
 * per PRD Section 3.5 & Section 10.6.
 */

import { formatSuccess, formatError } from '../utils/responseFormatter.js';
import {
  getStoreConnectionStatus,
  connectShopifyStore,
  disconnectShopifyStore,
  syncProductToShopify,
} from '../services/shopify/shopifySyncService.js';

export const getStatus = async (req, res, next) => {
  try {
    const status = await getStoreConnectionStatus();
    res.json(formatSuccess(status, 'Shopify connection status retrieved'));
  } catch (err) {
    next(err);
  }
};

export const connectStore = async (req, res, next) => {
  try {
    const { shopDomain, code } = req.body;
    const result = await connectShopifyStore({ shopDomain, code });
    res.json(formatSuccess(result, 'Shopify store connected'));
  } catch (err) {
    next(err);
  }
};

export const disconnectStore = async (req, res, next) => {
  try {
    const result = await disconnectShopifyStore();
    res.json(formatSuccess(result, 'Shopify store disconnected'));
  } catch (err) {
    next(err);
  }
};

export const handleCallback = async (req, res, next) => {
  try {
    const { shop, code } = req.query;
    await connectShopifyStore({ shopDomain: shop, code });
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/integrations?shopify=connected`);
  } catch (err) {
    next(err);
  }
};

export const syncProducts = async (req, res, next) => {
  try {
    const { productId, listing, mode } = req.body;

    if (!listing || !listing.title) {
      return res
        .status(400)
        .json(formatError('Invalid sync payload: listing with a title is required', 'VALIDATION_ERROR'));
    }

    const result = await syncProductToShopify({
      productId,
      listing,
      mode: mode || 'create',
    });

    res.status(200).json(formatSuccess(result, 'Product synchronised successfully with Shopify'));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(formatError(err.message, 'SYNC_ERROR'));
    }
    next(err);
  }
};

export const getStoreProducts = async (req, res, next) => {
  try {
    const status = await getStoreConnectionStatus();
    res.json(formatSuccess([], 'Shopify products retrieved'));
  } catch (err) {
    next(err);
  }
};

export default {
  getStatus,
  connectStore,
  disconnectStore,
  handleCallback,
  syncProducts,
  getStoreProducts,
};
