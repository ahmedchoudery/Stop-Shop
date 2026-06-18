import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  customerName:  { type: String, required: true, trim: true, maxlength: 100 },
  customerEmail: { type: String, required: true, trim: true, lowercase: true },
  rating:        { type: Number, required: true, min: 1, max: 5 },
  title:         { type: String, required: false, trim: true, default: '', maxlength: 120 },
  body:          { type: String, required: true, trim: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  productId:     { type: String, default: '' }, // optional — if review is for a specific product
  productName:   { type: String, default: '' }, // product name for displaying in admin panel
}, { timestamps: true, versionKey: false });

reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, productId: 1, createdAt: -1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
