import mongoose from 'mongoose';
import User from '../models/User.js';
import ProfitGoal from '../models/ProfitGoal.js';
import Order from '../models/Order.js';
import StoreDataImport from '../models/StoreDataImport.js';
import { sampleProfitGoals, sampleOrderRecords } from '../fixtures/sampleData.js';
import { parseAndValidateCsv, CSV_SCHEMA } from '../services/csvImportService.js';
import { aggregateOrdersProfit } from '../services/profitAggregationService.js';
import { validateGoal } from '../validators/goalValidator.js';
import { formatSuccess, formatError } from '../utils/responseFormatter.js';
import { generateRecoveryAdvice } from '../services/ai/goalAdvisor.js';

// In-memory fallback goal store
let inMemoryGoals = sampleProfitGoals.map((g, idx) => ({
  _id: g.id || `goal_${1000 + idx}`,
  userId: 'demo_user',
  title: g.title,
  currency: 'INR',
  month: '2026-11',
  targetProfit: g.targetProfit,
  monthlyNetProfitTarget: g.targetProfit,
  currentProfit: g.currentProfit,
  startDate: new Date(g.startDate),
  targetDate: new Date(g.targetDate),
  status: g.status,
  milestones: g.milestones || [],
  recommendedActions: g.recommendedActions || [],
  createdAt: new Date(),
}));

/**
 * Helper to compute pacing status based on progress vs day of month
 */
const calculatePacingStatus = (progressPercent, targetDate) => {
  if (progressPercent >= 100) return 'ACHIEVED';

  const now = new Date();
  const dayOfMonth = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expectedPacing = (dayOfMonth / totalDays) * 100;

  if (progressPercent >= expectedPacing * 0.9) return 'ON_TRACK';
  if (progressPercent >= expectedPacing * 0.6) return 'AT_RISK';
  return 'BEHIND';
};

/**
 * GET /api/profit-goals/csv/schema
 */
export const getCsvSchema = async (req, res, next) => {
  try {
    return res.json(
      formatSuccess(
        {
          schema: CSV_SCHEMA,
          sampleCsvTemplate:
            'date,product_name,units_sold,selling_price,cogs_per_unit,shipping_cost,platform_fee,ad_spend\n' +
            '2026-11-01,Sunset Projection LED Atmosphere Lamp,2,1499,420,160,60,350\n' +
            '2026-11-03,Wireless Ergonomic Split Mechanical Keyboard,1,4999,1950,250,100,650\n' +
            '2026-11-05,Smart Real-time Posture Corrector,3,1899,520,270,115,800\n',
        },
        'CSV schema specifications retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/profit-goals/csv/preview
 */
export const previewCsv = async (req, res, next) => {
  try {
    let csvInput = null;

    if (req.file && req.file.buffer) {
      csvInput = req.file.buffer;
    } else if (req.body && req.body.csvData) {
      csvInput = req.body.csvData;
    }

    if (!csvInput) {
      return res
        .status(400)
        .json(formatError('No CSV data provided. Upload a file or pass csvData string.', 'VALIDATION_ERROR'));
    }

    const report = await parseAndValidateCsv(csvInput);
    return res.json(formatSuccess(report, 'CSV preview and validation completed'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/profit-goals/import-csv
 */
export const importCsv = async (req, res, next) => {
  try {
    let csvInput = null;

    if (req.file && req.file.buffer) {
      csvInput = req.file.buffer;
    } else if (req.body && req.body.csvData) {
      csvInput = req.body.csvData;
    }

    if (!csvInput) {
      return res.status(400).json(formatError('No CSV data provided for import.', 'VALIDATION_ERROR'));
    }

    const report = await parseAndValidateCsv(csvInput);

    if (!report.isValid && report.validRows === 0) {
      return res
        .status(400)
        .json(formatError('CSV validation failed; no valid rows to import.', 'CSV_INVALID', report.errors));
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let userId = req.user?.id || req.user?._id;
    if (isDbConnected && (!userId || !mongoose.Types.ObjectId.isValid(userId))) {
      try {
        const dbUser = (await User.findOne({ email: req.user?.email })) || 
                       (await User.findOne({ email: 'ratneshshirodkar17@gmail.com' })) || 
                       (await User.findOne());
        userId = dbUser ? dbUser._id : new mongoose.Types.ObjectId();
      } catch {
        userId = new mongoose.Types.ObjectId();
      }
    } else if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      userId = new mongoose.Types.ObjectId().toString();
    }

    const importRecord = {
      id: 'imp_' + Date.now(),
      filename: req.file?.originalname || 'store_import.csv',
      recordCount: report.validRows,
      status: report.invalidRows === 0 ? 'COMPLETED' : 'PARTIAL_SUCCESS',
      errors: report.errors.map((e) => e.message),
      aggregates: report.aggregates,
      importedAt: new Date().toISOString(),
    };

    if (isDbConnected) {
      const storeImport = await StoreDataImport.create({
        userId,
        filename: importRecord.filename,
        recordCount: report.validRows,
        status: report.invalidRows === 0 ? 'COMPLETED' : 'FAILED',
        errors: importRecord.errors,
      });

      const orderDocs = report.allValidRecords.map((r) => ({
        userId,
        externalOrderId: r.order_id,
        orderDate: r.date,
        productName: r.product_name,
        unitsSold: r.units_sold,
        sellingPrice: r.selling_price,
        cogs: r.cogs_per_unit,
        shippingCost: r.shipping_cost,
        platformFee: r.platform_fee,
        adSpend: r.ad_spend,
        netProfit: r.computed.netProfit,
        source: 'CSV_IMPORT',
      }));

      await Order.insertMany(orderDocs);
      importRecord.id = storeImport._id;
    }

    return res.status(201).json(formatSuccess(importRecord, 'CSV data successfully imported and aggregated'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/profit-goals or /api/goals
 * Create or update monthly profit target (PRD Section 10.8)
 */
export const createGoal = async (req, res, next) => {
  try {
    const { isValid, errors } = validateGoal(req.body);
    if (!isValid) {
      return res.status(400).json(formatError('Validation error', 'VALIDATION_ERROR', errors));
    }

    const userId = req.user?.id || 'demo_user';
    const target = Number(req.body.monthlyNetProfitTarget ?? req.body.targetProfit);
    const currency = req.body.currency || 'INR';
    const month = req.body.month || new Date().toISOString().slice(0, 7);
    const title = req.body.title || `${month} Net Profit Goal`;

    // Generate monthly milestone targets (25%, 50%, 75%, 100%)
    const year = parseInt(month.split('-')[0], 10);
    const mNum = parseInt(month.split('-')[1], 10);
    const lastDay = new Date(year, mNum, 0).getDate();

    const milestones = [
      { targetAmount: Math.round(target * 0.25), targetDate: new Date(year, mNum - 1, 7), status: 'PENDING' },
      { targetAmount: Math.round(target * 0.5), targetDate: new Date(year, mNum - 1, 14), status: 'PENDING' },
      { targetAmount: Math.round(target * 0.75), targetDate: new Date(year, mNum - 1, 21), status: 'PENDING' },
      { targetAmount: target, targetDate: new Date(year, mNum - 1, lastDay), status: 'PENDING' },
    ];

    const isDbConnected = mongoose.connection.readyState === 1;
    let goalDoc = null;

    if (isDbConnected) {
      goalDoc = await ProfitGoal.create({
        userId,
        title,
        currency,
        month,
        targetProfit: target,
        monthlyNetProfitTarget: target,
        currentProfit: 0,
        startDate: new Date(year, mNum - 1, 1),
        targetDate: new Date(year, mNum - 1, lastDay),
        status: 'ON_TRACK',
        milestones,
      });
    } else {
      goalDoc = {
        _id: `goal_${Date.now()}`,
        userId,
        title,
        currency,
        month,
        targetProfit: target,
        monthlyNetProfitTarget: target,
        currentProfit: 0,
        startDate: new Date(year, mNum - 1, 1),
        targetDate: new Date(year, mNum - 1, lastDay),
        status: 'ON_TRACK',
        milestones,
        createdAt: new Date(),
      };
      inMemoryGoals.unshift(goalDoc);
    }

    return res.status(201).json(formatSuccess(goalDoc, 'Profit goal created successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/profit-goals/current or /api/goals/current
 * Retrieve active goal, actual profit, remaining target and pacing percentage (PRD Section 10.8)
 */
export const getCurrentGoal = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'demo_user';
    const isDbConnected = mongoose.connection.readyState === 1;

    let goal = null;
    let ordersList = [];

    if (isDbConnected) {
      goal = await ProfitGoal.findOne({ userId }).sort({ createdAt: -1 });
      ordersList = await Order.find({ userId });
    } else {
      goal = inMemoryGoals[0] || null;
      ordersList = sampleOrderRecords;
    }

    if (!goal) {
      return res.status(404).json(formatError('No active profit goal found', 'GOAL_NOT_FOUND'));
    }

    // Aggregate actual order performance
    const metrics = aggregateOrdersProfit(ordersList, {
      currency: goal.currency || 'INR',
      period: goal.month || 'current_month',
    });

    const target = goal.targetProfit || goal.monthlyNetProfitTarget || 50000;
    const currentNetProfit = metrics.financials.netProfit;
    const remainingProfit = Math.max(0, target - currentNetProfit);
    const progressPercent = target > 0 ? Number(((currentNetProfit / target) * 100).toFixed(1)) : 0;
    const pacingStatus = calculatePacingStatus(progressPercent, goal.targetDate);

    const goalStatus = {
      goalId: goal._id || goal.id,
      title: goal.title,
      currency: goal.currency || 'INR',
      month: goal.month || '2026-11',
      target,
      currentNetProfit,
      remainingProfit,
      progressPercent,
      status: pacingStatus,
      milestones: goal.milestones,
      financials: metrics.financials,
      productPerformance: metrics.productPerformance,
      dataSource: metrics.dataSource,
    };

    return res.json(formatSuccess(goalStatus, 'Current profit goal and progress retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/profit-goals/analyze or /api/goals/analyze
 * Deterministic analysis reconciling actual net profit against targets per PRD Section 10.8
 */
export const analyzeGoal = async (req, res, next) => {
  try {
    const { goalId, period = '2026-11', dataSource = 'csv_import' } = req.body;
    const userId = req.user?.id || 'demo_user';
    const isDbConnected = mongoose.connection.readyState === 1;

    let goal = null;
    let ordersList = [];

    if (isDbConnected) {
      if (goalId && mongoose.Types.ObjectId.isValid(goalId)) {
        goal = await ProfitGoal.findById(goalId);
      }
      if (!goal) {
        goal = await ProfitGoal.findOne({ userId }).sort({ createdAt: -1 });
      }
      ordersList = await Order.find({ userId });
    } else {
      goal = inMemoryGoals.find((g) => g._id === goalId || g.id === goalId) || inMemoryGoals[0];
      ordersList = sampleOrderRecords;
    }

    const target = goal?.targetProfit || goal?.monthlyNetProfitTarget || 50000;
    const currency = goal?.currency || 'INR';

    // Calculate deterministic metrics via profitAggregationService
    const metrics = aggregateOrdersProfit(ordersList, {
      currency,
      period,
      dataSource,
    });

    const currentNetProfit = metrics.financials.netProfit;
    const remainingProfit = Math.max(0, target - currentNetProfit);
    const progressPercent = target > 0 ? Number(((currentNetProfit / target) * 100).toFixed(1)) : 0;
    const pacingStatus = calculatePacingStatus(progressPercent, goal?.targetDate);

    // Formulate deterministic grounded AI / rule-based summary
    const topProduct = metrics.productPerformance[0];
    const aiSummary =
      progressPercent >= 100
        ? `Target achieved! Net profit (₹${currentNetProfit}) exceeded your ₹${target} goal, driven by ${topProduct?.productName || 'strong product performance'}.`
        : `Currently at ${progressPercent}% of target (₹${currentNetProfit} of ₹${target}). Remaining gap is ₹${remainingProfit}. Top revenue driver: ${topProduct?.productName || 'catalogue products'}.`;

    const analysisResponse = {
      goal: {
        currency,
        target,
        currentNetProfit,
        remainingProfit,
        progressPercent,
        status: pacingStatus,
      },
      financials: {
        revenue: metrics.financials.revenue,
        supplierCosts: metrics.financials.supplierCosts,
        advertisingCosts: metrics.financials.advertisingCosts,
        shippingCosts: metrics.financials.shippingCosts,
        platformFees: metrics.financials.platformFees,
        otherExpenses: metrics.financials.otherExpenses,
      },
      productPerformance: metrics.productPerformance,
      dataSource,
      calculationBasis: 'backend',
      aiSummary,
    };

    return res.json(formatSuccess(analysisResponse, 'Profit goal analysis calculated successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/profit-goals or /api/goals
 */
export const getGoals = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'demo_user';
    const isDbConnected = mongoose.connection.readyState === 1;

    let goals = [];
    if (isDbConnected) {
      goals = await ProfitGoal.find({ userId }).sort({ createdAt: -1 });
    } else {
      goals = inMemoryGoals;
    }

    return res.json(formatSuccess(goals, 'Goals retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/profit-goals/:id or /api/goals/:id
 */
export const getGoalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    let goal = null;
    if (isDbConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        goal = await ProfitGoal.findById(id);
      }
    } else {
      goal = inMemoryGoals.find((g) => g._id === id || g.id === id);
    }

    if (!goal) {
      return res.status(404).json(formatError('Goal not found', 'GOAL_NOT_FOUND'));
    }

    return res.json(formatSuccess(goal, 'Goal details retrieved'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/profit-goals/:id/progress or /api/goals/:id/progress
 */
export const getGoalProgress = async (req, res, next) => {
  try {
    return getCurrentGoal(req, res, next);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/profit-goals/:id/recovery-chat
 */
export const getRecoveryChat = async (req, res, next) => {
  try {
    let payload = { ...req.body };
    const goalId = req.params.id;

    if (!payload.financials || !payload.goalMetrics?.target) {
      const isDbConnected = mongoose.connection.readyState === 1;
      const userId = req.user?.id;

      let goal = null;
      if (goalId && mongoose.Types.ObjectId.isValid(goalId)) {
        goal = await ProfitGoal.findById(goalId);
      }
      if (!goal && isDbConnected) {
        goal = await ProfitGoal.findOne(userId ? { userId } : {}).sort({ createdAt: -1 });
      }

      let ordersList = [];
      if (isDbConnected) {
        ordersList = await Order.find(userId ? { userId } : {});
      }
      if (!ordersList || ordersList.length === 0) {
        ordersList = sampleOrderRecords;
      }

      const target = Number(payload.target || payload.goalMetrics?.target || goal?.targetProfit || goal?.monthlyNetProfitTarget || 50000);
      const metrics = aggregateOrdersProfit(ordersList);
      const currentNetProfit = metrics.financials.netProfit;
      const remainingProfit = Math.max(0, target - currentNetProfit);
      const progressPercent = target > 0 ? Number(((currentNetProfit / target) * 100).toFixed(1)) : 0;

      payload.goalMetrics = {
        target,
        currentNetProfit,
        remainingProfit,
        progressPercent,
        ...(payload.goalMetrics || {}),
      };
      payload.financials = {
        ...metrics.financials,
        ...(payload.financials || {}),
      };
      payload.productPerformance = metrics.productPerformance;
      payload.dataSource = ordersList === sampleOrderRecords ? 'demo_fixture' : 'database_orders';
    }

    const advice = await generateRecoveryAdvice(payload);
    return res.json(formatSuccess(advice, 'Recovery advice generated'));
  } catch (err) {
    next(err);
  }
};
