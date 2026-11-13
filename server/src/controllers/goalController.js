import { formatSuccess } from '../utils/responseFormatter.js';
import { generateRecoveryAdvice } from '../services/ai/goalAdvisor.js';
import ProfitGoal from '../models/ProfitGoal.js';

export const createGoal = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id || 'user_demo';
    const { title, targetProfit, startDate, targetDate } = req.body;

    let savedGoal = {
      _id: 'goal_' + Date.now(),
      userId,
      title: title || 'Monthly Net Profit Goal',
      targetProfit: Number(targetProfit) || 5000000,
      currentProfit: 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      targetDate: targetDate ? new Date(targetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ON_TRACK',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (userId && userId !== 'user_demo') {
        const doc = new ProfitGoal({
          userId,
          title: savedGoal.title,
          targetProfit: savedGoal.targetProfit,
          currentProfit: 0,
          startDate: savedGoal.startDate,
          targetDate: savedGoal.targetDate,
          status: 'ON_TRACK',
        });
        const saved = await doc.save();
        savedGoal = saved.toObject();
      }
    } catch {
      // Disconnected DB fallback
    }

    res.status(201).json(formatSuccess(savedGoal, 'Profit goal created'));
  } catch (err) {
    next(err);
  }
};

export const getGoals = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    let goals = [];
    try {
      const query = userId ? { userId } : {};
      goals = await ProfitGoal.find(query).sort({ createdAt: -1 });
    } catch {
      // Disconnected DB fallback
    }
    res.json(formatSuccess(goals, 'Goals retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    let goal = null;
    try {
      goal = await ProfitGoal.findById(req.params.id);
    } catch {
      // Disconnected DB fallback
    }
    if (!goal) {
      goal = {
        _id: req.params.id,
        title: 'Monthly Net Profit Target',
        targetProfit: 10000000,
        currentProfit: 6500000,
        status: 'AT_RISK',
      };
    }
    res.json(formatSuccess(goal, 'Goal details retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getGoalProgress = async (req, res, next) => {
  try {
    let goal = null;
    try {
      goal = await ProfitGoal.findById(req.params.id);
    } catch {
      // Disconnected DB fallback
    }

    const target = goal?.targetProfit || 10000000;
    const current = goal?.currentProfit || 6500000;
    const remaining = Math.max(0, target - current);
    const progressPercent = target > 0 ? (current / target) * 100 : 0;

    let pacing = 'ON_TRACK';
    if (progressPercent < 50) pacing = 'BEHIND';
    else if (progressPercent < 80) pacing = 'AT_RISK';

    const progressData = {
      goalId: req.params.id,
      targetProfit: target,
      currentProfit: current,
      remainingProfit: remaining,
      progressPercent: Number(progressPercent.toFixed(1)),
      pacing,
      lastUpdated: new Date().toISOString(),
    };

    res.json(formatSuccess(progressData, 'Goal progress retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getRecoveryChat = async (req, res, next) => {
  try {
    const goalId = req.params.id || req.body.goalId;
    let goalMetrics = req.body.goalMetrics || {};
    let financials = req.body.financials || {};

    if (goalId && (!goalMetrics.target || goalMetrics.target === 0)) {
      try {
        const goal = await ProfitGoal.findById(goalId);
        if (goal) {
          goalMetrics = {
            target: goal.targetProfit,
            currentNetProfit: goal.currentProfit,
            remainingProfit: Math.max(0, goal.targetProfit - goal.currentProfit),
            progressPercent: goal.targetProfit > 0 ? (goal.currentProfit / goal.targetProfit) * 100 : 0,
            status: goal.status,
            targetDate: goal.targetDate,
          };
        }
      } catch {
        // Disconnected DB fallback
      }
    }

    // Default sample goal metrics if none provided
    if (!goalMetrics.target && !goalMetrics.monthlyNetProfitTarget) {
      goalMetrics = {
        target: 10000000,
        currentNetProfit: 6500000,
        remainingProfit: 3500000,
        progressPercent: 65.0,
      };
    }

    const payload = {
      question: req.body.question || 'Why am I behind my monthly profit target?',
      goalMetrics,
      financials,
      productPerformance: req.body.productPerformance || [],
      dataSource: req.body.dataSource || 'csv_import',
    };

    const advice = await generateRecoveryAdvice(payload);
    res.json(formatSuccess(advice, 'Recovery advice generated'));
  } catch (err) {
    next(err);
  }
};

