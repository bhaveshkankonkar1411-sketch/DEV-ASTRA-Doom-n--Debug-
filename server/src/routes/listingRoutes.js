import express from 'express';
import { generateListing, generateMarketing, getListings, getListingById, createListing } from '../controllers/listingController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', authenticateToken, generateListing);
router.post('/generate-marketing', authenticateToken, generateMarketing);
router.get('/', authenticateToken, getListings);
router.get('/:id', authenticateToken, getListingById);
router.post('/', authenticateToken, createListing);

export default router;

