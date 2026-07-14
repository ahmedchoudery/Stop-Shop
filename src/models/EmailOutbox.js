import mongoose from 'mongoose';

const emailOutboxSchema = new mongoose.Schema({
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  template: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
    index: true,
  },
  cc: {
    type: String,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'failed', 'dlq'],
    default: 'pending',
    index: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastError: {
    type: String,
    default: '',
  },
  nextAttemptAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  sentAt: {
    type: Date,
  },
}, { timestamps: true, versionKey: false, collection: 'email_outbox' });

const EmailOutbox = mongoose.models.EmailOutbox || mongoose.model('EmailOutbox', emailOutboxSchema);
export default EmailOutbox;
export { EmailOutbox };
