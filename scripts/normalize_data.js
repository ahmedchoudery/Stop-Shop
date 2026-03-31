import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  
  console.log(`🔍 Inspecting ${products.length} products...`);
  
  for (const p of products) {
    const originalBucket = p.bucket || '';
    const originalSub = p.subCategory || '';
    const trimmedBucket = originalBucket.trim();
    const trimmedSub = originalSub.trim();
    
    if (originalBucket !== trimmedBucket || originalSub !== trimmedSub) {
      await db.collection('products').updateOne(
        { _id: p._id },
        { $set: { bucket: trimmedBucket, subCategory: trimmedSub } }
      );
      console.log(`✅ Fixed: "${originalBucket}" -> "${trimmedBucket}" for ${p.name}`);
    } else {
      console.log(`ℹ️ Already clean: "${originalBucket}" for ${p.name}`);
    }
  }
  
  console.log('🚀 Normalization Complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
