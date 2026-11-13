import express from 'express';
import multer from 'multer';
import { getOrders, importCsv } from '../controllers/orderController.js';
import authenticateToken from '../middleware/auth.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/', authenticateToken, getOrders);
router.post('/import-csv', authenticateToken, upload.single('file'), importCsv);

export default router;

