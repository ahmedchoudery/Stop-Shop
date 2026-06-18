import mongoose from 'mongoose';

const productNotificationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  productId: { type: String, required: true },
  selectedSize: { type: String, default: '' },
  selectedColor: { type: String, default: '' },
  notified: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

// Compound unique index to prevent duplicate signups for the same email + product + size/color configuration
productNotificationSchema.index({ email: 1, productId: 1, selectedSize: 1, selectedColor: 1 }, { unique: true });

const ProductNotification = mongoose.models.ProductNotification || mongoose.model('ProductNotification', productNotificationSchema);

export default ProductNotification;
