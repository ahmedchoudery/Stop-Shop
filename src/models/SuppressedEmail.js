import mongoose from 'mongoose';

const suppressedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  reason: {
    type: String,
    default: 'bounce',
  },
}, { timestamps: true, versionKey: false, collection: 'suppressed_emails' });

const SuppressedEmail = mongoose.models.SuppressedEmail || mongoose.model('SuppressedEmail', suppressedEmailSchema);
export default SuppressedEmail;
export { SuppressedEmail };
