import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function cleanDatabase() {
  console.log('🔒 Connecting to production database for cleanup...');
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const db = mongoose.connection.db;

  // 1. Delete test order(s)
  const orderRes = await db.collection('orders').deleteMany({
    $or: [
      { 'customer.name': 'Idempotency Tester' },
      { 'customer.email': { $regex: /test|e2e|idempotent/i } },
    ]
  });
  console.log(`✅ Deleted ${orderRes.deletedCount} test order(s)`);

  // 2. Clean idempotency_keys (all are from tests)
  const idempRes = await db.collection('idempotency_keys').deleteMany({});
  console.log(`✅ Deleted ${idempRes.deletedCount} idempotency key(s)`);

  // 3. Clean email_outbox (test emails)
  const emailRes = await db.collection('email_outbox').deleteMany({
    $or: [
      { to: { $regex: /test|e2e/i } },
      { template: 'low-stock-alert-admin' }, // from test low-stock alerts
    ]
  });
  console.log(`✅ Deleted ${emailRes.deletedCount} test email outbox entries`);

  // 4. Clean low stock alerts from test products
  const lsaRes = await db.collection('lowstockalerts').deleteMany({});
  console.log(`✅ Deleted ${lsaRes.deletedCount} low stock alert(s)`);

  // 5. Clean reservations
  const resRes = await db.collection('reservations').deleteMany({});
  console.log(`✅ Deleted ${resRes.deletedCount} reservation(s)`);

  // 6. Clean order_events
  const oeRes = await db.collection('order_events').deleteMany({});
  console.log(`✅ Deleted ${oeRes.deletedCount} order event(s)`);

  // 7. Clean suppressed_emails
  const seRes = await db.collection('suppressed_emails').deleteMany({});
  console.log(`✅ Deleted ${seRes.deletedCount} suppressed email(s)`);

  // 8. Clean productnotifications
  const pnRes = await db.collection('productnotifications').deleteMany({});
  console.log(`✅ Deleted ${pnRes.deletedCount} product notification(s)`);

  // 9. Clean stale login attempts
  const laRes = await db.collection('loginattempts').deleteMany({});
  console.log(`✅ Deleted ${laRes.deletedCount} login attempt(s)`);

  // 10. Clean stale refresh tokens
  const rtRes = await db.collection('refreshtokens').deleteMany({});
  console.log(`✅ Deleted ${rtRes.deletedCount} refresh token(s)`);

  // 11. Reset order counter to 0 so next real order starts fresh
  await db.collection('counters').updateOne(
    { _id: 'orderNumber' },
    { $set: { seq: 0 } },
    { upsert: true }
  );
  console.log('✅ Reset order counter to 0 (next order: STOP-2026-000001)');

  // 12. Clean customers collection (test customers)
  const custRes = await db.collection('customers').deleteMany({
    $or: [
      { email: { $regex: /test|e2e|idempotent/i } },
    ]
  });
  console.log(`✅ Deleted ${custRes.deletedCount} test customer(s)`);

  // Final summary
  console.log('\n=== FINAL COLLECTION COUNTS ===');
  const cols = await db.listCollections().toArray();
  for (const c of cols.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${count}`);
  }

  await mongoose.disconnect();
  console.log('\n🎉 Database cleanup complete!');
}

cleanDatabase().catch(console.error);
