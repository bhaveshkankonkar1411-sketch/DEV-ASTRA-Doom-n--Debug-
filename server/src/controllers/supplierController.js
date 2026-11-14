/**
 * Supplier Controller (T-011 / T-012)
 * Handles /api/suppliers endpoints per PRD Section 10.4
 */

import { formatSuccess, formatError } from '../utils/responseFormatter.js';
import {
  getAllSuppliers,
  getSupplierById as fetchSupplierById,
  compareSuppliersList,
} from '../services/suppliers/supplierComparison.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await getAllSuppliers();
    res.json(formatSuccess(suppliers, 'Suppliers retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const compareSuppliers = async (req, res, next) => {
  try {
    const { productId, supplierIds, suppliers } = req.body;

    // Support both direct supplierIds list or full suppliers array
    const comparisonResult = await compareSuppliersList({
      productId,
      supplierIds: supplierIds || (Array.isArray(suppliers) ? suppliers.map((s) => s.id || s._id) : []),
    });

    res.json(formatSuccess(comparisonResult, 'Supplier comparison computed successfully'));
  } catch (err) {
    next(err);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await fetchSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found', 'NOT_FOUND'));
    }
    res.json(formatSuccess(supplier, 'Supplier details retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

export const getSupplierProducts = async (req, res, next) => {
  try {
    const supplier = await fetchSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json(formatError('Supplier not found', 'NOT_FOUND'));
    }
    // Return sample linked products
    res.json(formatSuccess([], 'Supplier products retrieved'));
  } catch (err) {
    next(err);
  }
};

export default {
  getSuppliers,
  compareSuppliers,
  getSupplierById,
  getSupplierProducts,
};
