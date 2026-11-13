import express from 'express';
import { getSuppliers, compareSuppliers, getSupplierById } from '../controllers/supplierController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSuppliers);
router.post('/compare', compareSuppliers);
router.get('/:id', getSupplierById);

export default router;

