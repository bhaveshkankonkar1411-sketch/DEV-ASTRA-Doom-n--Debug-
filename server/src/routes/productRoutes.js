import express from 'express';
import {
  getProducts,
  getProductById,
  analyzeProduct,
  saveProduct,
} from '../controllers/productController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Public catalogue discovery
router.get('/', getProducts);
router.post('/analyze', analyzeProduct);
router.get('/:id', getProductById);
router.post('/:id/analyze', analyzeProduct);

// Authenticated user actions
router.post('/:id/save', authenticateToken, saveProduct);

export default router;
