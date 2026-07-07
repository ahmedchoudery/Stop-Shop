import mongoose from 'mongoose';

const loginAttemptSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { versionKey: false });

// TTL Index to automatically delete documents after 60 seconds (1 minute)
loginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 });

const LoginAttempt = mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', loginAttemptSchema);

export default LoginAttempt;
