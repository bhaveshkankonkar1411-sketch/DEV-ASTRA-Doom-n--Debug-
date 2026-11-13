import { formatSuccess } from '../utils/responseFormatter.js';
import { parseStoreCsv } from '../services/csvImportService.js';

export const getOrders = async (req, res, next) => {
  try {
    res.json(formatSuccess([], 'Orders retrieved'));
  } catch (err) {
    next(err);
  }
};

export const importCsv = async (req, res, next) => {
  try {
    const importResult = await parseStoreCsv(req.file?.path);
    res.json(formatSuccess(importResult, 'CSV import processed'));
  } catch (err) {
    next(err);
  }
};

