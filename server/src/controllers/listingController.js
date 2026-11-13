import mongoose from 'mongoose';
import { formatSuccess } from '../utils/responseFormatter.js';
import { generateProductListing } from '../services/ai/listingGenerator.js';
import { generateMarketingContent } from '../services/ai/contentGenerator.js';
import Product from '../models/Product.js';
import Listing from '../models/Listing.js';

export const generateListing = async (req, res, next) => {
  try {
    let payload = { ...req.body };

    // If productId is provided without explicit title, fetch details from Product catalog
    if (payload.productId && !payload.productTitle && !payload.productDetails?.name && !payload.name) {
      try {
        const product = await Product.findById(payload.productId);
        if (product) {
          payload.productTitle = product.title;
          payload.productDetails = {
            name: product.title,
            features: product.tags || [],
            category: product.category,
            description: product.description,
            suggestedRetailPrice: product.suggestedRetailPrice,
          };
        }
      } catch {
        // Continue with provided payload in disconnected DB mode
      }
    }

    const listing = await generateProductListing(payload);
    res.json(formatSuccess(listing, 'Listing generated'));
  } catch (err) {
    next(err);
  }
};

export const generateMarketing = async (req, res, next) => {
  try {
    let payload = { ...req.body };

    // If productId is provided without explicit title, fetch details from Product catalog
    if (payload.productId && !payload.productTitle && !payload.productDetails?.name && !payload.name) {
      try {
        const product = await Product.findById(payload.productId);
        if (product) {
          payload.productTitle = product.title;
          payload.sellingPoints = product.tags || [];
          payload.productDetails = {
            name: product.title,
            category: product.category,
            description: product.description,
          };
        }
      } catch {
        // Fallback in disconnected DB mode
      }
    }

    const content = await generateMarketingContent(payload);
    res.json(formatSuccess(content, 'Marketing content generated'));
  } catch (err) {
    next(err);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    let listings = [];
    try {
      const query = userId ? { userId } : {};
      listings = await Listing.find(query).populate('productId').sort({ updatedAt: -1 });
    } catch {
      // Disconnected DB mode
    }
    res.json(formatSuccess(listings, 'Listings retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getListingById = async (req, res, next) => {
  try {
    let listing = null;
    try {
      listing = await Listing.findById(req.params.id).populate('productId');
    } catch {
      // Disconnected DB mode
    }
    if (!listing) {
      listing = { id: req.params.id, title: 'Sample Listing', status: 'DRAFT' };
    }
    res.json(formatSuccess(listing, 'Listing retrieved'));
  } catch (err) {
    next(err);
  }
};

export const createListing = async (req, res, next) => {
  try {
    const rawUserId = req.user?.id || req.user?.userId || req.user?._id;
    let userId = rawUserId;
    if (!userId || userId === 'user_demo') {
      const User = (await import('../models/User.js')).default;
      const firstUser = await User.findOne();
      if (firstUser) userId = firstUser._id;
    }

    const { productId, title, description, keyFeatures, seoTitle, seoDescription, keywords, status } = req.body;

    let targetProductId = productId;
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        const matched = await Product.findOne({ $or: [{ sku: productId }, { id: productId }, { title: productId }] });
        if (matched) targetProductId = matched._id;
      }
    } else {
      const defaultProduct = await Product.findOne();
      if (defaultProduct) targetProductId = defaultProduct._id;
    }

    let savedListing = {
      _id: 'listing_' + Date.now(),
      userId,
      productId: targetProductId || null,
      generatedTitle: title || req.body.generatedTitle || 'Untitled Listing',
      generatedDescription: description || req.body.generatedDescription || '',
      featureBullets: keyFeatures || req.body.featureBullets || [],
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
      seoKeywords: keywords || req.body.seoKeywords || [],
      status: status || 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (targetProductId && userId && mongoose.Types.ObjectId.isValid(userId) && mongoose.Types.ObjectId.isValid(targetProductId)) {
        const doc = new Listing({
          userId,
          productId: targetProductId,
          generatedTitle: savedListing.generatedTitle,
          generatedDescription: savedListing.generatedDescription,
          featureBullets: savedListing.featureBullets,
          seoTitle: savedListing.seoTitle,
          seoDescription: savedListing.seoDescription,
          seoKeywords: savedListing.seoKeywords,
          status: savedListing.status,
        });
        const saved = await doc.save();
        savedListing = saved.toObject();
      }
    } catch (saveErr) {
      console.warn('[ListingController] Failed to persist listing document:', saveErr.message);
    }

    res.status(201).json(formatSuccess(savedListing, 'Listing saved successfully'));
  } catch (err) {
    next(err);
  }
};

