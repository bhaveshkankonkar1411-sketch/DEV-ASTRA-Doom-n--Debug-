import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    country: { type: String, default: 'CN' },
    unitPrice: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    shippingDaysMin: { type: Number, default: 7 },
    shippingDaysMax: { type: Number, default: 15 },
    moq: { type: Number, default: 1 },
    trustScore: { type: Number, min: 0, max: 100, default: 85 },
    trustBadge: {
      type: String,
      enum: ['VERIFIED', 'TOP_RATED', 'STANDARD', 'UNVERIFIED'],
      default: 'STANDARD',
    },
    rating: { type: Number, min: 0, max: 5, default: 4.5 },
    fulfillmentRate: { type: Number, min: 0, max: 100, default: 98 },
    sourceLabel: {
      type: String,
      enum: ['DEMO_FIXTURE', 'VERIFIED_PARTNER', 'ALIEXPRESS_SUPPLIER', 'CJ_SUPPLIER'],
      default: 'DEMO_FIXTURE',
    },
    sourceType: {
      type: String,
      enum: ['demo', 'verified_partner', 'aliexpress', 'cj_dropshipping'],
      default: 'demo',
    },
    availability: {
      type: String,
      enum: ['in_stock', 'limited_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    yearsInBusiness: { type: Number, default: 1 },
    returnRate: { type: Number, default: 1.0 },
    contactEmail: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Supplier', supplierSchema);

