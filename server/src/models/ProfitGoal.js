import mongoose from 'mongoose';

const profitGoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    currency: { type: String, default: 'INR' },
    month: { type: String, default: '2026-11' },
    targetProfit: { type: Number, required: true },
    monthlyNetProfitTarget: { type: Number },
    currentProfit: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date, required: true },
    status: { type: String, enum: ['ON_TRACK', 'AT_RISK', 'BEHIND', 'ACHIEVED'], default: 'ON_TRACK' },
    milestones: [
      {
        targetAmount: { type: Number, required: true },
        targetDate: { type: Date, required: true },
        achievedDate: { type: Date, default: null },
        status: { type: String, enum: ['PENDING', 'COMPLETED', 'MISSED'], default: 'PENDING' },
      },
    ],
    recommendedActions: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model('ProfitGoal', profitGoalSchema);

