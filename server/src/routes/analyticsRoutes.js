import express from 'express';
import { getSummary, getCharts } from '../controllers/analyticsController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticateToken, getSummary);
router.get('/charts', authenticateToken, getCharts);

export default router;

