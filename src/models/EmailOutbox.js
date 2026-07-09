import mongoose from 'mongoose';

const emailOutboxSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  html: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'failed'],
    default: 'pending',
    index: true,
  },
  error: {
    type: String,
    default: '',
  },
  attempts: {
    type: Number,
    default: 0,
  },
}, { timestamps: true, versionKey: false, collection: 'email_outbox' });

const EmailOutbox = mongoose.models.EmailOutbox || mongoose.model('EmailOutbox', emailOutboxSchema);
export default EmailOutbox;
export { EmailOutbox };
