import express from 'express';
import {
  getSuppliers,
  compareSuppliers,
  getSupplierById,
  getSupplierProducts,
} from '../controllers/supplierController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// GET /api/suppliers - list available suppliers
router.get('/', getSuppliers);

// POST /api/suppliers/compare - compare suppliers for product (PRD 10.4)
router.post('/compare', compareSuppliers);

// GET /api/suppliers/:id - supplier details
router.get('/:id', getSupplierById);

// GET /api/suppliers/:id/products - products provided by supplier
router.get('/:id/products', getSupplierProducts);

export default router;
