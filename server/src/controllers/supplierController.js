import { formatSuccess } from '../utils/responseFormatter.js';
import { compareSuppliersList } from '../services/suppliers/supplierComparison.js';

export const getSuppliers = async (req, res, next) => {
  try {
    res.json(formatSuccess([], 'Suppliers retrieved'));
  } catch (err) {
    next(err);
  }
};

export const compareSuppliers = async (req, res, next) => {
  try {
    const comparison = compareSuppliersList(req.body.suppliers || []);
    res.json(formatSuccess(comparison, 'Suppliers compared'));
  } catch (err) {
    next(err);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    res.json(formatSuccess({ id: req.params.id }, 'Supplier retrieved'));
  } catch (err) {
    next(err);
  }
};

