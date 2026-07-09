import mongoose from 'mongoose';

const idempotencyKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  response: {
    status: Number,
    body: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true, versionKey: false, collection: 'idempotency_keys' });

// TTL index to automatically delete expired keys after their expiresAt date
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const IdempotencyKey = mongoose.models.IdempotencyKey || mongoose.model('IdempotencyKey', idempotencyKeySchema);
export default IdempotencyKey;
export { IdempotencyKey };
