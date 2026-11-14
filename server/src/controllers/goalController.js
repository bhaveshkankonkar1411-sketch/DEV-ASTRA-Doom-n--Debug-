import mongoose from 'mongoose';
import { formatSuccess, formatError } from '../utils/responseFormatter.js';
import { parseAndValidateCsv, CSV_SCHEMA } from '../services/csvImportService.js';
import StoreDataImport from '../models/StoreDataImport.js';
import Order from '../models/Order.js';
import ProfitGoal from '../models/ProfitGoal.js';
import { generateRecoveryAdvice } from '../services/ai/goalAdvisor.js';
import { aggregateOrdersProfit } from '../services/profitAggregationService.js';
import { sampleOrderRecords } from '../fixtures/sampleData.js';

const inMemoryGoals = new Map();

const asMonthRange = (month) => {
  const [year, value] = String(month || '').split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(value) || value < 1 || value > 12) return null;
  const start = new Date(Date.UTC(year, value - 1, 1));
  const end = new Date(Date.UTC(year, value, 1));
  return { start, end };
};

const makeGoalView = (goal, metrics) => {
  const target = Number(goal.targetProfit);
  const currentNetProfit = Number(metrics.financials.netProfit);
  const remainingProfit = Math.max(0, target - currentNetProfit);
  const progressPercent = target ? Number((currentNetProfit / target * 100).toFixed(2)) : 0;
  return {
    goalId: String(goal._id || goal.id),
    month: goal.month,
    target,
    currentNetProfit,
    remainingProfit,
    progressPercent,
    status: currentNetProfit >= target ? 'ACHIEVED' : progressPercent >= 75 ? 'ON_TRACK' : 'AT_RISK',
    milestones: goal.milestones || [],
    financials: metrics.financials,
    productPerformance: metrics.productPerformance,
    dataSource: metrics.dataSource,
  };
};

const getMetrics = async (userId, month) => {
  const range = asMonthRange(month);
  let orders;
  if (mongoose.connection.readyState === 1) {
    const query = { userId };
    if (range) query.orderDate = { $gte: range.start, $lt: range.end };
    orders = await Order.find(query);
  } else {
    orders = sampleOrderRecords.filter(order => !range || (new Date(order.orderDate) >= range.start && new Date(order.orderDate) < range.end));
  }
  return aggregateOrdersProfit(orders, { period: month, dataSource: mongoose.connection.readyState === 1 ? 'database' : 'sample_orders' });
};

/**
 * GET /api/goals/csv/schema or /api/profit-goals/csv/schema
 * Return official CSV column schema specification and sample template
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
 * POST /api/goals/csv/preview or /api/profit-goals/csv/preview
 * Parse uploaded CSV file or body string, validate headers and rows, and return preview + preliminary totals
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
 * POST /api/goals/import-csv or /api/profit-goals/import-csv
 * Validates and imports store performance records into database
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
      return res
        .status(400)
        .json(formatError('No CSV data provided for import.', 'VALIDATION_ERROR'));
    }

    const report = await parseAndValidateCsv(csvInput);

    if (!report.isValid && report.validRows === 0) {
      return res
        .status(400)
        .json(formatError('CSV validation failed; no valid rows to import.', 'CSV_INVALID', report.errors));
    }

    const userId = req.user?.id || 'demo_seller_user';
    const isDbConnected = mongoose.connection.readyState === 1;

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

export const createGoal = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const target = Number(payload.monthlyNetProfitTarget ?? payload.targetProfit ?? 0);
    const currency = payload.currency || 'INR';
    const month = payload.month;

    if (!/^[0-9]{4}-[0-9]{2}$/.test(String(month || '')) || !Number.isFinite(target) || target <= 0 || currency !== 'INR') {
      return res.status(400).json(formatError('Provide a valid month, INR currency, and positive monthly target.', 'VALIDATION_ERROR'));
    }

    const userId = req.user.id;
    const range = asMonthRange(month);
    const base = {
      userId,
      title: `${month} net profit target`,
      currency,
      month,
      targetProfit: target,
      monthlyNetProfitTarget: target,
      currentProfit: 0,
      startDate: range.start,
      targetDate: new Date(Date.UTC(range.end.getUTCFullYear(), range.end.getUTCMonth(), 0, 23, 59, 59)),
      status: 'ON_TRACK',
      milestones: [25, 50, 75, 100].map(percent => ({
        targetAmount: Number((target * percent / 100).toFixed(2)),
        targetDate: new Date(range.start.getTime() + (range.end.getTime() - range.start.getTime()) * (percent / 100)),
        achievedDate: null,
        status: 'PENDING',
      })),
      recommendedActions: [],
    };

    let goal;
    if (mongoose.connection.readyState === 1) {
      const existing = await ProfitGoal.findOne({ userId, month });
      goal = existing ? await ProfitGoal.findByIdAndUpdate(existing._id, base, { new: true }) : await ProfitGoal.create(base);
    } else {
      goal = { ...base, _id: `goal_${Date.now()}`, id: `goal_${Date.now()}` };
      inMemoryGoals.set(userId, goal);
    }

    const goalId = String(goal._id || goal.id);
    res.status(201).json(formatSuccess({
      _id: goalId,
      id: goalId,
      month,
      currency,
      targetProfit: target,
      monthlyNetProfitTarget: target,
      milestones: goal.milestones || base.milestones,
    }, 'Profit goal created'));
  } catch (err) {
    next(err);
  }
};

export const getCurrentGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goal = mongoose.connection.readyState === 1
      ? await ProfitGoal.findOne({ userId }).sort({ updatedAt: -1 })
      : inMemoryGoals.get(userId);
    if (!goal) return res.status(404).json(formatError('No active profit goal exists.', 'GOAL_NOT_FOUND'));
    const metrics = await getMetrics(userId, goal.month);
    res.json(formatSuccess(makeGoalView(goal, metrics), 'Current profit goal retrieved'));
  } catch (err) { next(err); }
};

export const analyzeGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goal = mongoose.connection.readyState === 1
      ? await ProfitGoal.findById(req.body?.goalId)
      : inMemoryGoals.get(userId);
    if (!goal || (mongoose.connection.readyState === 1 && String(goal.userId) !== String(userId))) {
      return res.status(404).json(formatError('Profit goal not found.', 'GOAL_NOT_FOUND'));
    }
    const metrics = await getMetrics(userId, goal.month);
    const view = makeGoalView(goal, metrics);
    res.json(formatSuccess({ goal: view, financials: metrics.financials, productPerformance: metrics.productPerformance, calculationBasis: 'backend', dataSource: metrics.dataSource, aiSummary: `Net profit is ${view.progressPercent}% of the ${goal.month} target based on ${metrics.dataSource.replaceAll('_', ' ')}.` }, 'Profit goal analysis completed'));
  } catch (err) { next(err); }
};

export const getGoals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goals = mongoose.connection.readyState === 1
      ? await ProfitGoal.find({ userId }).sort({ createdAt: -1 })
      : [...inMemoryGoals.values()].filter(goal => String(goal.userId) === String(userId));

    res.json(formatSuccess(goals.map(goal => ({
      _id: String(goal._id || goal.id),
      id: String(goal._id || goal.id),
      month: goal.month,
      currency: goal.currency || 'INR',
      targetProfit: Number(goal.targetProfit ?? goal.monthlyNetProfitTarget ?? 0),
      monthlyNetProfitTarget: Number(goal.monthlyNetProfitTarget ?? goal.targetProfit ?? 0),
      milestones: goal.milestones || [],
    })), 'Goals retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goal = mongoose.connection.readyState === 1
      ? await ProfitGoal.findById(req.params.id)
      : [...inMemoryGoals.values()].find(item => String(item._id || item.id) === String(req.params.id) && String(item.userId) === String(userId));

    if (!goal) {
      return res.status(404).json(formatError('Goal not found.', 'GOAL_NOT_FOUND'));
    }

    const payload = {
      _id: String(goal._id || goal.id),
      id: String(goal._id || goal.id),
      userId: String(goal.userId),
      month: goal.month,
      currency: goal.currency || 'INR',
      targetProfit: Number(goal.targetProfit ?? goal.monthlyNetProfitTarget ?? 0),
      monthlyNetProfitTarget: Number(goal.monthlyNetProfitTarget ?? goal.targetProfit ?? 0),
      milestones: goal.milestones || [],
      status: goal.status || 'ON_TRACK',
      startDate: goal.startDate,
      targetDate: goal.targetDate,
    };

    res.json(formatSuccess(payload, 'Goal details retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getGoalProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goal = mongoose.connection.readyState === 1
      ? await ProfitGoal.findById(req.params.id)
      : [...inMemoryGoals.values()].find(item => String(item._id || item.id) === String(req.params.id) && String(item.userId) === String(userId));

    if (!goal) {
      return res.status(404).json(formatError('Goal not found.', 'GOAL_NOT_FOUND'));
    }

    const metrics = await getMetrics(userId, goal.month);
    const view = makeGoalView(goal, metrics);
    res.json(formatSuccess({ id: String(goal._id || goal.id), month: goal.month, pacing: view.status, progressPercent: view.progressPercent, remainingProfit: view.remainingProfit }, 'Goal progress retrieved'));
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
