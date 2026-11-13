import express from 'express';
import { getProducts, getProductById, analyzeProduct } from '../controllers/productController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/:id/analyze', authenticateToken, analyzeProduct);

export default router;

