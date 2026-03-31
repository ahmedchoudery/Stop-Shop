import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI missing from .env');
  process.exit(1);
}

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: [String], default: ['admin'] },
  isPrimary: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema({
  bucket: { type: String, default: 'Tops' },
  subCategory: { type: String, default: 'General' },
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Reset Admin Account
    const email = 'admin@gmail.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`🔑 Resetting Admin: ${email}...`);
    await Admin.findOneAndUpdate(
      { email },
      { 
        name: 'Primary Admin',
        password: hashedPassword,
        roles: ['super-admin'],
        isPrimary: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Admin reset successfully.');

    // 2. Normalize Product Categories (Bucket & subCategory)
    console.log('🧹 Normalizing Product Data (trimming buckets)...');
    const products = await Product.find({});
    let updatedCount = 0;

    for (const p of products) {
      const trimmedBucket = (p.bucket || 'Tops').trim();
      const trimmedSub = (p.subCategory || 'General').trim();

      if (p.bucket !== trimmedBucket || p.subCategory !== trimmedSub) {
        p.bucket = trimmedBucket;
        p.subCategory = trimmedSub;
        await p.save();
        updatedCount++;
      }
    }
    console.log(`✅ Normalized ${updatedCount} products.`);

    console.log('🚀 DB Fix Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during fix:', err.message);
    process.exit(1);
  }
}

run();
