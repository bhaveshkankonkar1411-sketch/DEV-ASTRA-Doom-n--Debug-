import express from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import listingRoutes from './listingRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import pricingRoutes from './pricingRoutes.js';
import shopifyRoutes from './shopifyRoutes.js';
import orderRoutes from './orderRoutes.js';
import goalRoutes from './goalRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/listings', listingRoutes);
router.use('/ai/listings', listingRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/pricing', pricingRoutes);
router.use('/shopify', shopifyRoutes);
router.use('/orders', orderRoutes);
router.use('/goals', goalRoutes);
router.use('/profit-goals', goalRoutes);
router.use('/analytics', analyticsRoutes);

export default router;

