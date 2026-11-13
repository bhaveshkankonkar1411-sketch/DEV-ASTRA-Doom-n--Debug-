import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    generatedTitle: { type: String, required: true },
    generatedDescription: { type: String, required: true },
    featureBullets: [{ type: String }],
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: [{ type: String }],
    socialMediaHooks: {
      tiktokHook: { type: String, default: '' },
      instagramCaption: { type: String, default: '' },
    },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
    shopifyProductId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Listing', listingSchema);

