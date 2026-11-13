import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    tags: [{ type: String }],
    suggestedRetailPrice: { type: Number, required: true },
    estimatedCost: { type: Number, required: true },
    estimatedMargin: { type: Number, default: 0 },
    demandScore: { type: Number, default: 0 },
    trendVelocity: { type: String, enum: ['RISING', 'STABLE', 'FALLING'], default: 'STABLE' },
    imageUrl: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    sourceLabel: {
      type: String,
      enum: ['DEMO_CATALOGUE', 'CURATED_FEED', 'ALIEXPRESS', 'CJ_DROPSHIPPING'],
      default: 'DEMO_CATALOGUE',
    },
    sku: { type: String, default: '' },
    inventoryCount: { type: Number, default: 100 },
    suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);

