import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name:                 { type: String, required: true, trim: true },
  email:                { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:             { type: String, required: true, select: false },
  isPrimary:            { type: Boolean, default: false },
  roles:                { type: [String], enum: ['admin', 'super-admin', 'auditor'], default: ['admin'] },
  failedLoginAttempts:  { type: Number, default: 0 },
  lockUntil:            { type: Date, default: null },
  lastLogin:            { type: Date, default: null },
}, { timestamps: true, versionKey: false });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
