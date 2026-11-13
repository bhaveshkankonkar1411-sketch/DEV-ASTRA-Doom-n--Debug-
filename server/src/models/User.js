import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    shopifyStore: {
      shopDomain: { type: String, default: null },
      accessToken: { type: String, default: null },
      isConnected: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

