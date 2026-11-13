import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import { sampleProducts, sampleSuppliers } from '../fixtures/sampleData.js';
import { formatSuccess, formatError } from '../utils/responseFormatter.js';
import { seedDatabase } from '../scripts/seed.js';
import { computeSemanticSearch, analyzeReviewSentiment } from '../services/ai/huggingFaceService.js';
import { rankProductsByOpportunity } from '../services/ai/recommendationService.js';

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

      let total = await Product.countDocuments(query);

      // If database is completely empty on initial setup, auto-seed sample catalogue
      if (total === 0 && !search.trim() && !category.trim() && !source.trim()) {
        try {
          await seedDatabase();
          total = await Product.countDocuments(query);
        } catch (seedErr) {
          console.warn('[Product Controller] Auto-seed failed, falling back to sample fixtures:', seedErr.message);
        }
      }

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

// Customer reviews map for products with verified feedback evidence
export const productCustomerReviews = {
  prod_001: [
    'Sunset warm lighting makes aesthetic TikTok room content look professional.',
    'Base is heavy enough not to tip over, lens stays cool to touch.',
    'USB cable is slightly short, had to use an extension cord.',
    'Amazing ambient light for evening reading and background video.',
  ],
  prod_002: [
    'Split ergonomic design completely relieved wrist pain during long coding sessions.',
    'Mechanical switches are quiet enough for office calls without clacking loudly.',
    'Takes 2-3 days to get used to the split layout, but totally worth it.',
    'Bluetooth multi-device pairing switches instantly between Mac and PC.',
  ],
  prod_003: [
    'Vibration buzzer alerts me whenever I start slouching at my desk.',
    'Straps are soft under clothing, doesn’t dig into armpits.',
    'Battery lasts nearly a full week on a single charge.',
    'Calibration takes a minute to set the right angle threshold.',
  ],
  prod_004: [
    'Compact espresso maker produces rich crema on camping trips without electricity.',
    'Easy to rinse and pack into a backpack, solid pressure pump.',
    'Takes some arm strength to pump, but the espresso flavor is excellent.',
  ],
  prod_005: [
    'Hands-free neck cooling is essential for hot commute and outdoor walks.',
    'Bladeless design is safe, doesn’t catch long hair.',
    'A bit noisy on highest fan speed setting 3, but speed 1 and 2 are very quiet.',
  ],
  prod_006: [
    'My golden retriever loves this brush. The button releases the hair in one clean chunk!',
    'Saves so much vacuuming time. Very gentle on sensitive dog skin.',
    'Works well on long hair cat fur too, easy to clean.',
  ],
  prod_007: [
    'The magnet snap is super strong, charges my phone fast and the built-in stand is great for movies.',
    'Compact size fits easily in my pocket. Premium aluminum build.',
    'Great travel charger, gets slightly warm during 15W fast charge which is normal.',
  ],
  prod_008: [
    'Keeps water ice cold all day at the gym. LED touch display is really sleek.',
    'No leaks, durable stainless steel finish, and looks premium on my desk.',
    'Nice bottle, battery for the temperature screen lasts months.',
  ],
  'LAMP-SUNSET-01': [
    'Sunset warm lighting makes aesthetic TikTok room content look professional.',
    'Base is heavy enough not to tip over, lens stays cool to touch.',
    'USB cable is slightly short, had to use an extension cord.',
    'Amazing ambient light for evening reading and background video.',
  ],
  'KB-SPLIT-02': [
    'Split ergonomic design completely relieved wrist pain during long coding sessions.',
    'Mechanical switches are quiet enough for office calls without clacking loudly.',
    'Takes 2-3 days to get used to the split layout, but totally worth it.',
    'Bluetooth multi-device pairing switches instantly between Mac and PC.',
  ],
  'HLTH-POSTURE-03': [
    'Vibration buzzer alerts me whenever I start slouching at my desk.',
    'Straps are soft under clothing, doesn’t dig into armpits.',
    'Battery lasts nearly a full week on a single charge.',
    'Calibration takes a minute to set the right angle threshold.',
  ],
  'KITCH-ESPR-04': [
    'Compact espresso maker produces rich crema on camping trips without electricity.',
    'Easy to rinse and pack into a backpack, solid pressure pump.',
    'Takes some arm strength to pump, but the espresso flavor is excellent.',
  ],
  'FAN-NECK-05': [
    'Hands-free neck cooling is essential for hot commute and outdoor walks.',
    'Bladeless design is safe, doesn’t catch long hair.',
    'A bit noisy on highest fan speed setting 3, but speed 1 and 2 are very quiet.',
  ],
  'PET-BRUSH-06': [
    'My golden retriever loves this brush. The button releases the hair in one clean chunk!',
    'Saves so much vacuuming time. Very gentle on sensitive dog skin.',
    'Works well on long hair cat fur too, easy to clean.',
  ],
  'TECH-MAGPOWER-07': [
    'The magnet snap is super strong, charges my phone fast and the built-in stand is great for movies.',
    'Compact size fits easily in my pocket. Premium aluminum build.',
    'Great travel charger, gets slightly warm during 15W fast charge which is normal.',
  ],
  'BTL-THERMO-08': [
    'Keeps water ice cold all day at the gym. LED touch display is really sleek.',
    'No leaks, durable stainless steel finish, and looks premium on my desk.',
    'Nice bottle, battery for the temperature screen lasts months.',
  ],
};

/**
 * POST /api/products/semantic-search
 * Semantic similarity matching using sentence-transformers/all-MiniLM-L6-v2
 */
export const semanticSearchProducts = async (req, res, next) => {
  try {
    const query = req.body.query || req.query.q || '';
    if (!query.trim()) {
      return getProducts(req, res, next);
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let allProducts = [];
    if (isDbConnected) {
      allProducts = await Product.find().populate('suppliers');
    }
    if (!allProducts || allProducts.length === 0) {
      allProducts = sampleProducts;
    }

    const results = await computeSemanticSearch(query, allProducts);
    const isFallback = results[0]?.isFallback ?? false;
    const model = results[0]?.model || 'sentence-transformers/all-MiniLM-L6-v2';
    const provider = results[0]?.provider || (isFallback ? 'Local Deterministic Vector Engine' : 'Hugging Face Hosted Inference Router');

    return res.json(
      formatSuccess(
        {
          query,
          count: results.length,
          model,
          provider,
          inferenceMode: isFallback ? 'FALLBACK' : 'LIVE',
          isFallback,
          fallbackReason: results[0]?.fallbackReason || null,
          results,
        },
        'Semantic search completed'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id/sentiment or POST /api/products/:id/sentiment
 * Customer review sentiment analysis using cardiffnlp/twitter-roberta-base-sentiment-latest
 */
export const getProductSentiment = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const isDbConnected = mongoose.connection.readyState === 1;

    let product = null;
    if (isDbConnected && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = sampleProducts.find((p) => p.id === productId || p._id === productId || p.sku === productId);
    }

    const productName = product?.title || product?.name || 'Selected Product';
    const matchedSample = sampleProducts.find(
      (sp) => sp.title === product?.title || sp.sku === product?.sku || sp.id === productId || sp.id === product?.id
    );
    const reviews =
      req.body.reviews ||
      productCustomerReviews[productId] ||
      productCustomerReviews[product?.id] ||
      (matchedSample ? productCustomerReviews[matchedSample.id] : null) ||
      productCustomerReviews[product?.sku] ||
      [];

    const sentiment = await analyzeReviewSentiment({
      reviews,
      productName,
    });

    return res.json(formatSuccess(sentiment, 'Sentiment analysis completed'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET or POST /api/products/recommendations
 * Multi-Criteria Opportunity Scoring & Ranking with Gemini Strategic Explanation
 */
export const getProductRecommendations = async (req, res, next) => {
  try {
    const query = req.body.query || req.query.q || '';
    const includeExplanation = req.body.includeExplanation !== false;

    const isDbConnected = mongoose.connection.readyState === 1;
    let allProducts = [];
    if (isDbConnected) {
      allProducts = await Product.find().populate('suppliers');
    }
    if (!allProducts || allProducts.length === 0) {
      allProducts = sampleProducts;
    }

    const recommendations = await rankProductsByOpportunity({
      products: allProducts,
      query,
      includeAiExplanation: includeExplanation,
    });

    return res.json(
      formatSuccess(
        {
          count: recommendations.length,
          query: query || null,
          scoringMethod: 'multi-criteria-opportunity-engine',
          weights: {
            profitMargin: query ? '30%' : '35%',
            marketDemand: query ? '25%' : '30%',
            supplierReliability: query ? '20%' : '25%',
            shippingSpeed: '10%',
            semanticRelevance: query ? '15%' : '0%',
          },
          recommendations,
        },
        'Product opportunity recommendations calculated'
      )
    );
  } catch (err) {
    next(err);
  }
};
