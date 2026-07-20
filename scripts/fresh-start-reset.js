import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Collections to completely clear for a clean fresh start
const COLLECTIONS_TO_CLEAR = [
  'idempotency_keys',
  'inventories',
  'loginattempts',
  'lowstockalerts',
  'order_events',
  'orders',
  'productnotifications',
  'products',
  'refreshtokens',
  'reservations',
  'reviews',
  'subscribers',
  'suppressed_emails',
  'customers'
];

async function freshStartCleanup() {
  console.info('🔒 Connecting to production database for complete catalog & order reset...');
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const db = mongoose.connection.db;

  // Clear transactional and catalog collections
  for (const colName of COLLECTIONS_TO_CLEAR) {
    try {
      const res = await db.collection(colName).deleteMany({});
      console.info(`✅ Cleared collection "${colName}": deleted ${res.deletedCount} documents.`);
    } catch (err) {
      console.warn(`⚠️ Could not clear collection "${colName}": ${err.message}`);
    }
  }

  // Reset order counter sequence
  try {
    await db.collection('counters').updateOne(
      { _id: 'orderNumber' },
      { $set: { seq: 0 } },
      { upsert: true }
    );
    console.info('✅ Reset order counter to 0 (next order sequence starts at STOP-2026-000001).');
  } catch (err) {
    console.warn(`⚠️ Could not reset order counter: ${err.message}`);
  }

  // Verify preserved security credentials (we must not delete admin users, settings, and roles)
  console.info('\n=== PRESERVED SYSTEM COLLECTIONS ===');
  const systemCollections = ['admins', 'users', 'userroles', 'settings', 'coupons'];
  for (const sysCol of systemCollections) {
    try {
      const count = await db.collection(sysCol).countDocuments();
      console.info(`  ${sysCol}: ${count} documents preserved.`);
    } catch (err) {
      console.warn(`⚠️ Could not count system collection "${sysCol}": ${err.message}`);
    }
  }

  // Complete breakdown of database collections
  console.info('\n=== DATABASE FRESH STATE VERIFICATION ===');
  const cols = await db.listCollections().toArray();
  for (const c of cols.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    console.info(`  ${c.name}: ${count} documents`);
  }

  await mongoose.disconnect();
  console.info('\n🎉 Database is 100% ready for your fresh catalog entry and real orders!');
}

freshStartCleanup().catch(console.error);
