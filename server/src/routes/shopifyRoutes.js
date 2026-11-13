import express from 'express';
import {
  getStatus,
  connectStore,
  disconnectStore,
  handleCallback,
  syncProducts,
  getStoreProducts,
} from '../controllers/shopifyController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET /api/shopify/status or /api/stores/shopify/status (PRD 10.6)
router.get('/status', authenticateToken, getStatus);

// POST /api/shopify/connect - Connect store
router.post('/connect', authenticateToken, connectStore);

// DELETE /api/shopify/disconnect - Disconnect store (PRD 10.6)
router.delete('/disconnect', authenticateToken, disconnectStore);

// GET /api/shopify/callback - OAuth redirect handler
router.get('/callback', handleCallback);

// POST /api/shopify/sync or /api/shopify/products/sync (PRD 10.6)
router.post('/sync', authenticateToken, syncProducts);
router.post('/products/sync', authenticateToken, syncProducts);

// GET /api/shopify/products - List products
router.get('/products', authenticateToken, getStoreProducts);

export default router;
