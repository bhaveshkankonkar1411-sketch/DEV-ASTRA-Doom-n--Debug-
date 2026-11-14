import express from 'express';
import multer from 'multer';
import {
  createGoal,
  getCurrentGoal,
  analyzeGoal,
  getGoals,
  getGoalById,
  getGoalProgress,
  getRecoveryChat,
  getCsvSchema,
  previewCsv,
  importCsv,
} from '../controllers/goalController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per PRD
});

// CSV Schema, Preview & Ingestion (T-021)
router.get('/csv/schema', getCsvSchema);
router.post('/csv/preview', upload.single('file'), previewCsv);
router.post('/import-csv', upload.single('file'), importCsv);

// Profit Goal Management (T-023 per PRD Section 10.8)
router.post('/', authenticateToken, createGoal);
router.get('/', authenticateToken, getGoals);
router.get('/current', authenticateToken, getCurrentGoal);
router.post('/analyze', authenticateToken, analyzeGoal);
router.get('/:id', authenticateToken, getGoalById);
router.get('/:id/progress', authenticateToken, getGoalProgress);
router.post('/:id/recovery-chat', authenticateToken, getRecoveryChat);

export default router;
