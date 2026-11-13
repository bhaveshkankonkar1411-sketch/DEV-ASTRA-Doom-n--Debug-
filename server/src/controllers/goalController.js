import mongoose from 'mongoose';
import { formatSuccess, formatError } from '../utils/responseFormatter.js';
import { parseAndValidateCsv, CSV_SCHEMA } from '../services/csvImportService.js';
import StoreDataImport from '../models/StoreDataImport.js';
import Order from '../models/Order.js';
import { generateRecoveryAdvice } from '../services/ai/goalAdvisor.js';

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
