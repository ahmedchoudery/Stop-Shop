import mongoose from 'mongoose';

const lowStockAlertSchema = new mongoose.Schema({
  sku:          { type: String, required: true, index: true },
  variantId:    { type: String, required: true },
  date:         { type: String, required: true }, // Format: YYYY-MM-DD
  snoozedUntil: { type: Date, default: null },
  status:       { type: String, enum: ['active', 'restocked', 'snoozed'], default: 'active' },
}, { timestamps: true, versionKey: false });

lowStockAlertSchema.index({ sku: 1, variantId: 1, date: 1 }, { unique: true });

const LowStockAlert = mongoose.models.LowStockAlert || mongoose.model('LowStockAlert', lowStockAlertSchema);

export default LowStockAlert;
