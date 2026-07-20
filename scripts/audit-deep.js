import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const db = mongoose.connection.db;

  // 1. Check audit logs for order-related actions
  console.log('=== ORDER-RELATED AUDIT LOGS ===');
  const orderLogs = await db.collection('auditlogs').find({
    action: { $regex: /ORDER|STOCK|DELETE/i }
  }).sort({ createdAt: -1 }).limit(30).toArray();
  console.log(`Found ${orderLogs.length} order-related audit logs`);
  for (const l of orderLogs) {
    console.log(`  ${l.action} | orderId: ${l.details?.orderId || 'N/A'} | ${l.createdAt}`);
  }

  // 2. Check product audit logs to understand section assignments
  console.log('\n=== PRODUCT UPDATE AUDIT LOGS ===');
  const productLogs = await db.collection('auditlogs').find({
    action: { $regex: /PRODUCT/i }
  }).sort({ createdAt: -1 }).limit(20).toArray();
  console.log(`Found ${productLogs.length} product audit logs`);
  for (const l of productLogs) {
    console.log(`  ${l.action} | product: ${l.details?.productName || l.details?.productId || 'N/A'} | section: ${l.details?.changes?.featuredSection || 'N/A'} | ${l.createdAt}`);
  }

  // 3. Show full featured section breakdown
  console.log('\n=== FEATURED SECTION BREAKDOWN ===');
  const sections = await db.collection('products').aggregate([
    { $group: { _id: '$featuredSection', count: { $sum: 1 }, products: { $push: '$name' } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  for (const s of sections) {
    console.log(`\n  Section: "${s._id}" (${s.count} products):`);
    for (const p of s.products) {
      console.log(`    - ${p}`);
    }
  }

  // 4. Check for any collection that might have backup orders
  console.log('\n=== ALL COLLECTIONS WITH COUNTS ===');
  const cols = await db.listCollections().toArray();
  for (const c of cols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${count}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
