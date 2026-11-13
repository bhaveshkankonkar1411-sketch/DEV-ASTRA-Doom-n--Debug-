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
    contactEmail: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Supplier', supplierSchema);

