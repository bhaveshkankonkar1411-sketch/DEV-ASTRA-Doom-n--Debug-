import express from 'express';
import multer from 'multer';
import {
  getOrders,
  getOrderMetrics,
  getOrderById,
  updateOrderStatus,
  importCsv,
} from '../controllers/orderController.js';
import authenticateToken from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.get('/', authenticateToken, getOrders);
router.get('/metrics', authenticateToken, getOrderMetrics);
router.get('/summary', authenticateToken, getOrderMetrics);
router.get('/:orderId', authenticateToken, getOrderById);
router.patch('/:orderId/status', authenticateToken, updateOrderStatus);
router.post('/import-csv', authenticateToken, upload.single('file'), importCsv);

export default router;
