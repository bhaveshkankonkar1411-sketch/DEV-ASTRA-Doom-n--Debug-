import mongoose from 'mongoose';

const storeDataImportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    recordCount: { type: Number, default: 0 },
    status: { type: String, enum: ['PROCESSING', 'COMPLETED', 'FAILED'], default: 'PROCESSING' },
    errors: [{ type: String }],
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export default mongoose.model('StoreDataImport', storeDataImportSchema);

