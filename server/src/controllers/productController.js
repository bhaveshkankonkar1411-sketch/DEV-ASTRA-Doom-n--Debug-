import { formatSuccess } from '../utils/responseFormatter.js';
import { analyzeProductOpportunity } from '../services/ai/productAnalysis.js';
import Product from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    res.json(formatSuccess([], 'Products retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    res.json(formatSuccess({ id: req.params.id }, 'Product details retrieved'));
  } catch (err) {
    next(err);
  }
};

export const analyzeProduct = async (req, res, next) => {
  try {
    let productData = { productId: req.params.id, title: req.body?.title || 'Selected Product', ...req.body };
    try {
      const dbProduct = await Product.findById(req.params.id);
      if (dbProduct) {
        productData = {
          productId: dbProduct._id.toString(),
          title: dbProduct.title,
          category: dbProduct.category,
          suggestedRetailPrice: dbProduct.suggestedRetailPrice,
          estimatedCost: dbProduct.estimatedCost,
          description: dbProduct.description,
          dataSource: 'catalog_db',
        };
      }
    } catch {
      // If DB disconnected or demo ID, use request body
    }

    const analysis = await analyzeProductOpportunity(productData);
    res.json(formatSuccess(analysis, 'Product analyzed'));
  } catch (err) {
    next(err);
  }
};

