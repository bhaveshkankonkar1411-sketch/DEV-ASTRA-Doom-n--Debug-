import { formatSuccess } from '../utils/responseFormatter.js';
import { generateProductListing } from '../services/ai/listingGenerator.js';
import { generateMarketingContent } from '../services/ai/contentGenerator.js';

export const generateListing = async (req, res, next) => {
  try {
    const listing = await generateProductListing(req.body);
    res.json(formatSuccess(listing, 'Listing generated'));
  } catch (err) {
    next(err);
  }
};

export const generateMarketing = async (req, res, next) => {
  try {
    const content = await generateMarketingContent(req.body);
    res.json(formatSuccess(content, 'Marketing content generated'));
  } catch (err) {
    next(err);
  }
};

export const getListings = async (req, res, next) => {
  try {
    res.json(formatSuccess([], 'Listings retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getListingById = async (req, res, next) => {
  try {
    res.json(formatSuccess({ id: req.params.id }, 'Listing retrieved'));
  } catch (err) {
    next(err);
  }
};

export const createListing = async (req, res, next) => {
  try {
    res.status(201).json(formatSuccess(req.body, 'Listing saved'));
  } catch (err) {
    next(err);
  }
};

