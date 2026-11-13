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
    const userId = req.user?.userId || req.user?._id || 'user_demo';
    const { productId, title, description, keyFeatures, seoTitle, seoDescription, keywords, status } = req.body;

    let savedListing = {
      _id: 'listing_' + Date.now(),
      userId,
      productId: productId || null,
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
      if (productId && userId && userId !== 'user_demo') {
        const doc = new Listing({
          userId,
          productId,
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
    } catch {
      // Graceful fallback for mock mode
    }

    res.status(201).json(formatSuccess(savedListing, 'Listing saved'));
  } catch (err) {
    next(err);
  }
};

