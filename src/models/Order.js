import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  id:            { type: String, required: true },   // Product SKU / ID
  name:          { type: String, required: true },
  price:         { type: Number, required: true, min: 0 },
  quantity:      { type: Number, default: 1, min: 1 },
  selectedSize:  { type: String, default: '' },
  selectedColor: { type: String, default: '' },      // ← Color variant chosen by customer
  category:      { type: String, default: '' },      // ← Product bucket (Tops, Bottoms…)
  subCategory:   { type: String, default: '' },      // ← e.g. T-Shirt, Jeans
}, { _id: false });

export const PAYMENT_METHODS = ['COD', 'ATM Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'];

const orderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true, index: true },
  customer: {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    address: String,
    city:    String,
    zip:     String,
  },
  items:         [orderItemSchema],
  total:         { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true, enum: PAYMENT_METHODS },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
    index: true,
  },
  ip:            { type: String, default: '' },
}, { timestamps: true, versionKey: false });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ orderID: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
