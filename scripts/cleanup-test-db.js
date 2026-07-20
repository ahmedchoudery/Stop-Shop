import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const TEST_PRODUCT_IDS = [
  'PRD-API',
  'PRD-LOW',
  'PRD-VEL',
  'PRD-RACE-TEST',
  'PRD-IDEMPOTENCY-TEST',
  'P001',
  'P002',
  'P003'
];

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const db = mongoose.connection.db;

  // 1. Delete test products from stopshop.products
  const prodRes = await db.collection('products').deleteMany({
    id: { $in: TEST_PRODUCT_IDS }
  });
  console.log(`Deleted ${prodRes.deletedCount} test products from 'products' collection.`);

  // 2. Delete test products from stopshop.inventories
  const invRes = await db.collection('inventories').deleteMany({
    productId: { $in: TEST_PRODUCT_IDS }
  });
  console.log(`Deleted ${invRes.deletedCount} test products from 'inventories' collection.`);

  // 3. Drop the 'test' database on the Atlas cluster
  console.log('Dropping the standalone "test" database...');
  const testDbConnection = await mongoose.createConnection(MONGO_URI, { dbName: 'test' }).asPromise();
  await testDbConnection.dropDatabase();
  console.log('Successfully dropped the "test" database.');

  await testDbConnection.close();
  await mongoose.disconnect();
  console.log('Cleanup complete!');
}

run().catch(console.error);
