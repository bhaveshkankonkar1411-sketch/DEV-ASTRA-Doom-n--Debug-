import express from 'express';
import {
  getProducts,
  getProductById,
  analyzeProduct,
  saveProduct,
  semanticSearchProducts,
  getProductSentiment,
  getProductRecommendations,
} from '../controllers/productController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Public catalogue discovery & Multi-Model ML Engine
router.get('/', getProducts);
router.get('/recommendations', getProductRecommendations);
router.post('/recommendations', getProductRecommendations);
router.post('/semantic-search', semanticSearchProducts);
router.get('/semantic-search', semanticSearchProducts);
router.post('/analyze', analyzeProduct);
router.get('/:id/sentiment', getProductSentiment);
router.post('/:id/sentiment', getProductSentiment);
router.get('/:id', getProductById);
router.post('/:id/analyze', analyzeProduct);

// Authenticated user actions
router.post('/:id/save', authenticateToken, saveProduct);

export default router;
