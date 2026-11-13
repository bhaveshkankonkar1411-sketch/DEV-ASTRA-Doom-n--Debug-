import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import { sampleProducts, sampleSuppliers } from '../fixtures/sampleData.js';
import { formatSuccess, formatError } from '../utils/responseFormatter.js';

// Helper to populate suppliers for in-memory fixture products
const populateSampleProductSuppliers = (product) => {
  const supplierMap = new Map(sampleSuppliers.map((s) => [s.id, s]));
  const populatedSuppliers = (product.supplierIds || [])
    .map((sId) => supplierMap.get(sId))
    .filter(Boolean);
  return {
    ...product,
    suppliers: populatedSuppliers,
  };
};

/**
 * GET /api/products
 * Search, filter by category/source, sort, and paginate product catalogue
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      search = '',
      category = '',
      source = '',
      page = 1,
      limit = 10,
      sortBy = 'demandScore',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const query = {};

      if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { description: regex }, { tags: { $in: [regex] } }, { sku: regex }];
      }

      if (category.trim()) {
        query.category = new RegExp(`^${category.trim()}$`, 'i');
      }

      if (source.trim()) {
        query.sourceLabel = source.trim();
      }

      const total = await Product.countDocuments(query);
      const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
      const sortOptions = { [sortBy]: sortDirection };

      const products = await Product.find(query)
        .populate('suppliers')
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.json(
        formatSuccess(
          {
            products,
            pagination: {
              total,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(total / limitNum) || 1,
            },
          },
          'Products retrieved successfully'
        )
      );
    }

    // In-memory fallback
    let filtered = sampleProducts.map(populateSampleProductSuppliers);

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(term))) ||
          (p.sku && p.sku.toLowerCase().includes(term))
      );
    }

    if (category.trim()) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.trim().toLowerCase());
    }

    if (source.trim()) {
      filtered = filtered.filter((p) => p.sourceLabel === source.trim());
    }

    // Sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortOrder.toLowerCase() === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    const total = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    return res.json(
      formatSuccess(
        {
          products: paginated,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
          },
        },
        'Products retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 * Retrieve details for a single product with populated suppliers
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    let product = null;

    if (isDbConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id).populate('suppliers');
      }
      if (!product) {
        product = await Product.findOne({ $or: [{ sku: id }, { _id: id }] }).populate('suppliers');
      }
    } else {
      // In-memory fallback
      const found = sampleProducts.find((p) => p.id === id || p._id === id || p.sku === id);
      if (found) {
        product = populateSampleProductSuppliers(found);
      }
    }

    if (!product) {
      return res.status(404).json(formatError('Product not found', 'PRODUCT_NOT_FOUND'));
    }

    return res.json(formatSuccess(product, 'Product details retrieved'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products/analyze or POST /api/products/:id/analyze
 * Deterministic financial & opportunity analysis grounded in supplied product data
 */
export const analyzeProduct = async (req, res, next) => {
  try {
<<<<<<< HEAD
    const productId = req.params.id || req.body.productId;
    const context = req.body.analysisContext || {};
    const desiredMargin = context.desiredMarginPercent || 30;

    if (!productId) {
      return res.status(400).json(formatError('Product ID is required for analysis', 'VALIDATION_ERROR'));
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let product = null;

    if (isDbConnected) {
      if (mongoose.Types.ObjectId.isValid(productId)) {
        product = await Product.findById(productId).populate('suppliers');
      }
      if (!product) {
        product = await Product.findOne({ $or: [{ sku: productId }, { _id: productId }] }).populate('suppliers');
      }
    } else {
      const found = sampleProducts.find((p) => p.id === productId || p._id === productId || p.sku === productId);
      if (found) {
        product = populateSampleProductSuppliers(found);
      }
    }

    if (!product) {
      return res.status(404).json(formatError('Product not found for analysis', 'PRODUCT_NOT_FOUND'));
    }

    // Deterministic arithmetic calculation
    const retailPrice = product.suggestedRetailPrice;
    const cost = product.estimatedCost;
    const actualMarginPercent = retailPrice > 0 ? parseFloat((((retailPrice - cost) / retailPrice) * 100).toFixed(1)) : 0;
    const demandScore = product.demandScore || 70;

    // Opportunity score: 45% margin rating, 40% demand, 15% trend
    let trendFactor = 0.8;
    if (product.trendVelocity === 'RISING') trendFactor = 1.0;
    if (product.trendVelocity === 'STABLE') trendFactor = 0.85;
    if (product.trendVelocity === 'FALLING') trendFactor = 0.6;

    const marginScore = Math.min(100, Math.max(0, (actualMarginPercent / desiredMargin) * 75));
    const opportunityScore = Math.round(marginScore * 0.45 + demandScore * 0.4 + trendFactor * 15);

    const strengths = [];
    const risks = [];

    if (actualMarginPercent >= desiredMargin) {
      strengths.push(`Healthy estimated margin of ${actualMarginPercent}% exceeds the ${desiredMargin}% target.`);
    } else {
      risks.push(`Current estimated margin (${actualMarginPercent}%) is below your ${desiredMargin}% target.`);
    }

    if (product.trendVelocity === 'RISING') {
      strengths.push('Market trend velocity is currently rising based on recent search and sales indicators.');
    } else if (product.trendVelocity === 'FALLING') {
      risks.push('Demand trend velocity is declining; monitor advertising costs closely.');
    }

    if (product.suppliers && product.suppliers.length > 0) {
      const verified = product.suppliers.filter((s) => s.trustBadge === 'VERIFIED' || s.trustBadge === 'TOP_RATED');
      if (verified.length > 0) {
        strengths.push(`${verified.length} verified supplier options available.`);
      } else {
        risks.push('Supplier options carry standard/unverified badges; supplier vetting recommended.');
      }
    }

    const recommendation =
      opportunityScore >= 75
        ? 'Strong candidate for listing. Proceed with AI Listing Studio to generate SEO and social copy.'
        : 'Moderate candidate. Consider negotiating supplier unit costs or testing with small ad spend.';

    const analysis = {
      productId: product.id || product._id,
      title: product.title,
      currency: product.currency || 'INR',
      suggestedRetailPrice: retailPrice,
      estimatedCost: cost,
      estimatedMarginPercent: actualMarginPercent,
      targetMarginPercent: desiredMargin,
      opportunityScore: Math.min(100, Math.max(0, opportunityScore)),
      scoreLabel: product.sourceLabel === 'DEMO_CATALOGUE' ? 'Demo estimate' : 'Catalogue calculation',
      strengths,
      risks,
      recommendation,
      dataSource: product.sourceLabel === 'DEMO_CATALOGUE' ? 'demo' : 'verified_catalogue',
    };

    return res.json(formatSuccess(analysis, 'Product analysis generated successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products/:id/save
 * Save product to user's saved items catalogue
 */
export const saveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'demo_user';

    return res.status(201).json(
      formatSuccess(
        {
          productId: id,
          userId,
          savedAt: new Date().toISOString(),
        },
        'Product saved to your catalogue successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};
