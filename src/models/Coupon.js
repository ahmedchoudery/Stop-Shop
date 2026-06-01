import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:          { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value:         { type: Number, required: true, min: 0 },   // 20 = 20% off | 500 = Rs.500 off
  minOrderValue: { type: Number, default: 0 },               // min cart total to qualify
  maxUses:       { type: Number, default: null },             // null = unlimited
  usedCount:     { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  expiresAt:     { type: Date, default: null },               // null = never expires
}, { timestamps: true, versionKey: false });

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default Coupon;
