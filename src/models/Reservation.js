import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  productId: { type: String, required: true },
  variantId: { type: String, required: true },
  qty: { type: Number, required: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { collection: 'reservations', timestamps: true });

// Configure TTL index on expiresAt
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
reservationSchema.index({ userId: 1 });
reservationSchema.index({ productId: 1, variantId: 1, userId: 1 }, { unique: true });

const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
export default Reservation;
export { Reservation };
