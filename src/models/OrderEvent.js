import mongoose from 'mongoose';

const orderEventSchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  actorUserId: { type: String, default: 'system' },
  at: { type: Date, default: Date.now },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { collection: 'order_events', timestamps: false });

const OrderEvent = mongoose.models.OrderEvent || mongoose.model('OrderEvent', orderEventSchema);
export default OrderEvent;
export { OrderEvent };
