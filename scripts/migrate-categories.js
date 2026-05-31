import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────
// NEW CATEGORY MAP
// ─────────────────────────────────────────────────────────────────

const CATEGORY_MAP = {
  Tops: ['Polo', 'Shirt', 'Tshirt', 'Sweatshirt', 'Hoodie', 'Jacket'],
  Bottoms: ['Jeans', 'Trousers', 'Shorts'],
  Footwear: ['Shoes', 'Slippers', 'Socks'],
  Accessories: ['Glasses', 'Watches', 'Rings', 'Bracelet', 'Chains', 'Caps', 'Belts', 'Bags'],
};

const VALID_BUCKETS = Object.keys(CATEGORY_MAP);

// ─────────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────────

const productSchema = new mongoose.Schema({
  bucket:      { type: String },
  subCategory: { type: String },
}, { strict: false });

const inventorySchema = new mongoose.Schema({
  productId:   { type: String },
  category:    { type: String },
  subCategory: { type: String },
}, { strict: false });

async function run() {
  console.log('\n🚀 Starting Category & SubCategory Migration...\n');

  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const db = mongoose.connection.db;
  
  const Product = mongoose.model('Product', productSchema);
  const Inventory = mongoose.model('Inventory', inventorySchema);

  const products = await Product.find().lean();
  let updatedProducts = 0;

  for (const p of products) {
    let newBucket = p.bucket;
    let newSub = p.subCategory;

    // Fix Bucket
    if (!VALID_BUCKETS.includes(newBucket)) {
      newBucket = 'Tops'; // default
    }

    // Fix SubCategory
    let validSubs = CATEGORY_MAP[newBucket].map(s => s.toLowerCase());
    if (!newSub || !validSubs.includes(newSub.toLowerCase())) {
      // Try to find a match across all categories first
      let matched = false;
      for (const [bucket, subs] of Object.entries(CATEGORY_MAP)) {
        if (newSub && subs.map(s => s.toLowerCase()).includes(newSub.toLowerCase())) {
          newBucket = bucket;
          newSub = subs.find(s => s.toLowerCase() === newSub.toLowerCase());
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // Fallback to the first subCategory of the new bucket
        newSub = CATEGORY_MAP[newBucket][0];
      }
    } else {
      // Ensure proper capitalization
      newSub = CATEGORY_MAP[newBucket].find(s => s.toLowerCase() === newSub.toLowerCase());
    }

    if (p.bucket !== newBucket || p.subCategory !== newSub) {
      await db.collection('products').updateOne(
        { _id: p._id },
        { $set: { bucket: newBucket, subCategory: newSub } }
      );
      
      // Update inventory as well
      await db.collection('inventories').updateOne(
        { productId: p.id || p._id.toString() },
        { $set: { category: newBucket, subCategory: newSub } }
      );
      
      console.log(`Updated Product ${p._id}: ${p.bucket}/${p.subCategory} -> ${newBucket}/${newSub}`);
      updatedProducts++;
    }
  }

  console.log(`\n✅ Migration Complete! Updated ${updatedProducts} products.`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(e => {
  console.error('\n❌ Fatal error during migration:', e.message);
  process.exit(1);
});
