import express from 'express';
import { generateListing, getListings, getListingById, createListing } from '../controllers/listingController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', authenticateToken, generateListing);
router.get('/', authenticateToken, getListings);
router.get('/:id', authenticateToken, getListingById);
router.post('/', authenticateToken, createListing);

export default router;

