import mongoose from 'mongoose';
import dotenv from 'dotenv';
import argon2 from 'argon2';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@stopshop.com';

const userSchema = new mongoose.Schema({
  email:             { type: String, required: true, unique: true },
  passwordHash:      { type: String, required: true },
  name:              { type: String },
  createdAt:         { type: Date, default: Date.now },
  twoFactorEnabled:  { type: Boolean, default: false },
  twoFactorSecret:   { type: String },
  failedLoginCount:  { type: Number, default: 0 },
  lockedUntil:       { type: Date }
}, { strict: false });

const userRoleSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role:       { type: String, enum: ['admin', 'staff', 'customer'] },
  assignedBy: { type: String, default: 'system' },
  assignedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const UserRole = mongoose.models.UserRole || mongoose.model('UserRole', userRoleSchema);

async function run() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI or MONGODB_URI is not set in env');
    process.exit(1);
  }

  console.info('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  console.info('✅ Connected.');

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    console.info(`ℹ️ Admin user with email ${email} already exists. Updating password...`);
    const tempPassword = process.env.ADMIN_PASSWORD || (crypto.randomBytes(12).toString('base64') + '!Aa1');
    const hash = await argon2.hash(tempPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });

    await User.findByIdAndUpdate(existing._id, {
      passwordHash: hash,
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      backupCodes: [],
      failedLoginCount: 0,
      lockedUntil: null
    });
    console.info('✅ Password updated and 2FA reset successfully.');
    
    // Ensure they have the admin role
    const hasAdminRole = await UserRole.findOne({ userId: existing._id, role: 'admin' });
    if (!hasAdminRole) {
      await UserRole.create({
        userId: existing._id,
        role: 'admin',
        assignedBy: 'system'
      });
      console.info('✅ Added admin role to existing user.');
    }
  } else {
    // Use configured ADMIN_PASSWORD from env or generate a secure temporary password
    const tempPassword = process.env.ADMIN_PASSWORD || (crypto.randomBytes(12).toString('base64') + '!Aa1');
    
    const hash = await argon2.hash(tempPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });

    const user = await User.create({
      email,
      passwordHash: hash,
      name: 'System Admin',
      twoFactorEnabled: false,
      failedLoginCount: 0,
      createdAt: new Date()
    });

    await UserRole.create({
      userId: user._id,
      role: 'admin',
      assignedBy: 'system'
    });

    console.info('\n==================================================');
    console.info('🎉 INITIAL ADMIN ACCOUNT CREATED SUCCESSFULLY! 🎉');
    console.info(`📧 Email:              ${email}`);
    console.info(`🔑 Temporary Password: ${tempPassword}`);
    console.info('==================================================');
    console.info('⚠️ Please copy this password and log in immediately to set up 2FA.');
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
