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
  image:         { type: String, default: '' },      // Product image URL stored at purchase time
}, { _id: false });

export const PAYMENT_METHODS = ['COD', 'ATM Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'];

export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Confirmed',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Paid',
  'Failed',
  'Refunded',
];

const orderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true, index: true },
  customer: {
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    phone:   { type: String, required: true }, // Contact number required for shipping & logistics
    address: String,
    city:    String,
    zip:     String,
  },
  items:         [orderItemSchema],
  total:         { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true, enum: PAYMENT_METHODS },
  status: {
    type: String,
    enum: ORDER_STATUSES,
    default: 'Pending',
    index: true,
  },
  paymentDetails: {
    transactionID:  { type: String, index: true },
    status:         { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    paymentAccount: { type: String, default: '' }, // e.g. Easypaisa wallet number or masked card number
    cardBrand:      { type: String, default: '' }, // e.g. Visa, Mastercard
    refundedAt:     { type: Date },
    refundReason:   { type: String, default: '' },
    gatewayLogs:    [{
      action:    { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      details:   { type: mongoose.Schema.Types.Mixed },
    }],
  },
  ip:            { type: String, default: '' },
  courier:       { type: String, default: '' },
  trackingNumber:{ type: String, default: '' },
}, { timestamps: true, versionKey: false });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ orderID: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
