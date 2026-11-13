import express from 'express';
import {
  createGoal,
  getGoals,
  getGoalById,
  getGoalProgress,
  getRecoveryChat,
} from '../controllers/goalController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createGoal);
router.post('/recovery-assistant', authenticateToken, getRecoveryChat);
router.get('/', authenticateToken, getGoals);
router.get('/:id', authenticateToken, getGoalById);
router.get('/:id/progress', authenticateToken, getGoalProgress);
router.post('/:id/recovery-chat', authenticateToken, getRecoveryChat);

export default router;

