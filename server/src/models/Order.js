import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    externalOrderId: { type: String, default: null },
    orderDate: { type: Date, required: true },
    productName: { type: String, required: true },
    unitsSold: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true },
    cogs: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    adSpend: { type: Number, default: 0 },
    netProfit: { type: Number, required: true },
    source: { type: String, enum: ['SHOPIFY', 'CSV_IMPORT', 'MANUAL'], default: 'CSV_IMPORT' },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);

