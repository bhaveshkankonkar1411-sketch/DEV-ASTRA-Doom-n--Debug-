import mongoose from 'mongoose';
import config from '../config/environment.js';
import connectDatabase from '../config/database.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import ProfitGoal from '../models/ProfitGoal.js';
import Order from '../models/Order.js';
import { sampleSuppliers, sampleProducts, sampleProfitGoals, sampleOrderRecords } from '../fixtures/sampleData.js';

export const seedDatabase = async () => {
  console.log('[Seed] Connecting to database...');
  await connectDatabase();

  if (mongoose.connection.readyState !== 1) {
    console.warn('[Seed] MongoDB not connected. Cannot seed live database. Fixtures remain available via fixtures/sampleData.js');
    return;
  }

  try {
    console.log('[Seed] Clearing existing demo collections...');
    await Promise.all([
      Product.deleteMany({ sourceLabel: { $in: ['DEMO_CATALOGUE', 'CURATED_FEED'] } }),
      Supplier.deleteMany({ sourceLabel: { $in: ['DEMO_FIXTURE', 'VERIFIED_PARTNER', 'ALIEXPRESS_SUPPLIER', 'CJ_SUPPLIER'] } }),
    ]);

    console.log('[Seed] Inserting suppliers...');
    const supplierDocs = await Supplier.insertMany(
      sampleSuppliers.map((s) => ({
        name: s.name,
        country: s.country,
        unitPrice: s.unitPrice,
        shippingCost: s.shippingCost,
        shippingDaysMin: s.shippingDaysMin,
        shippingDaysMax: s.shippingDaysMax,
        moq: s.moq,
        trustScore: s.trustScore,
        trustBadge: s.trustBadge,
        rating: s.rating,
        fulfillmentRate: s.fulfillmentRate,
        sourceLabel: s.sourceLabel,
        contactEmail: s.contactEmail,
      }))
    );

    const supplierMap = new Map();
    sampleSuppliers.forEach((s, idx) => {
      supplierMap.set(s.id, supplierDocs[idx]._id);
    });

    console.log('[Seed] Inserting products with linked suppliers...');
    const productsToInsert = sampleProducts.map((p) => {
      const linkedSupplierIds = (p.supplierIds || []).map((id) => supplierMap.get(id)).filter(Boolean);
      return {
        title: p.title,
        description: p.description,
        category: p.category,
        tags: p.tags,
        suggestedRetailPrice: p.suggestedRetailPrice,
        estimatedCost: p.estimatedCost,
        estimatedMargin: p.estimatedMargin,
        demandScore: p.demandScore,
        trendVelocity: p.trendVelocity,
        currency: p.currency,
        sourceLabel: p.sourceLabel,
        sku: p.sku,
        inventoryCount: p.inventoryCount,
        imageUrl: p.imageUrl,
        suppliers: linkedSupplierIds,
      };
    });

    const productDocs = await Product.insertMany(productsToInsert);

    console.log(`[Seed] Successfully seeded:`);
    console.log(` - ${supplierDocs.length} suppliers`);
    console.log(` - ${productDocs.length} products`);

    return { suppliers: supplierDocs, products: productDocs };
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    throw error;
  }
};

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]', err.message);
      process.exit(1);
    });
}

export default seedDatabase;

