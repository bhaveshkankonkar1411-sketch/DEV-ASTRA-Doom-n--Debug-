import { formatSuccess } from '../utils/responseFormatter.js';
import { generateRecoveryAdvice } from '../services/ai/goalAdvisor.js';

export const createGoal = async (req, res, next) => {
  try {
    res.status(201).json(formatSuccess(req.body, 'Profit goal created'));
  } catch (err) {
    next(err);
  }
};

export const getGoals = async (req, res, next) => {
  try {
    res.json(formatSuccess([], 'Goals retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    res.json(formatSuccess({ id: req.params.id }, 'Goal details retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getGoalProgress = async (req, res, next) => {
  try {
    res.json(formatSuccess({ id: req.params.id, pacing: 'ON_TRACK' }, 'Goal progress retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getRecoveryChat = async (req, res, next) => {
  try {
    const advice = await generateRecoveryAdvice(req.body);
    res.json(formatSuccess(advice, 'Recovery advice generated'));
  } catch (err) {
    next(err);
  }
};

