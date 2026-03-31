import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

console.log('🔍 Diagnostic Started');
console.log('Project Root:', path.join(__dirname, '..'));
console.log('MONGO_URI exists:', !!MONGO_URI);

if (!MONGO_URI) {
  console.error('❌ MONGO_URI missing from .env');
  process.exit(1);
}

const adminSchema = new mongoose.Schema({
  email: String,
  name: String,
});

const productSchema = new mongoose.Schema({
  name: String,
  bucket: String,
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminCount = await Admin.countDocuments();
    const productCount = await Product.countDocuments();

    console.log('--- Statistics ---');
    console.log('Total Admins:', adminCount);
    console.log('Total Products:', productCount);

    if (adminCount > 0) {
      const admins = await Admin.find({}, 'email name');
      console.log('Admins List:', admins.map(a => a.email));
    } else {
      console.warn('⚠️ No admins found in database!');
    }

    if (productCount > 0) {
      const sample = await Product.findOne();
      console.log('Sample Product:', sample.name, '(Bucket:', sample.bucket, ')');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
