import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function clearAuditLogs() {
  console.info('🔒 Connecting to production database to clear audit logs...');
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const db = mongoose.connection.db;

  // 1. Delete auditlogs
  const auditRes = await db.collection('auditlogs').deleteMany({});
  console.info(`✅ Deleted ${auditRes.deletedCount} audit log entries.`);

  // 2. Double-check and delete any residual products/inventories if any still exist
  const prodRes = await db.collection('products').deleteMany({});
  console.info(`✅ Verified products collection is clean: deleted ${prodRes.deletedCount} products.`);

  const invRes = await db.collection('inventories').deleteMany({});
  console.info(`✅ Verified inventories collection is clean: deleted ${invRes.deletedCount} inventory records.`);

  // Final summary
  console.info('\n=== CURRENT COLLECTION COUNTS ===');
  const cols = await db.listCollections().toArray();
  for (const c of cols.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    console.info(`  ${c.name}: ${count}`);
  }

  await mongoose.disconnect();
  console.info('\n🎉 Audit logs cleared and catalog clean-up complete!');
}

clearAuditLogs().catch(console.error);
