import express from 'express';
import { connectStore, handleCallback, syncProducts, getStoreProducts } from '../controllers/shopifyController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.post('/connect', authenticateToken, connectStore);
router.get('/callback', handleCallback);
router.post('/sync', authenticateToken, syncProducts);
router.get('/products', authenticateToken, getStoreProducts);

export default router;

