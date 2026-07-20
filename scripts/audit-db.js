import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function audit() {
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const db = mongoose.connection.db;

  // 1. List all collections
  const cols = await db.listCollections().toArray();
  console.log('=== COLLECTIONS ===');
  for (const c of cols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${count} documents`);
  }

  // 2. Products - full detail
  console.log('\n=== PRODUCTS (id, name, featuredSection, displayOrder, createdAt) ===');
  const products = await db.collection('products').find({}).sort({ displayOrder: 1, createdAt: -1 }).toArray();
  for (const p of products) {
    console.log(`  ${p.id} | ${p.name} | section: ${p.featuredSection} | order: ${p.displayOrder} | created: ${p.createdAt}`);
  }

  // 3. Inventories - full detail
  console.log('\n=== INVENTORIES (productId, name, category) ===');
  const inventories = await db.collection('inventories').find({}).sort({ createdAt: 1 }).toArray();
  for (const inv of inventories) {
    console.log(`  ${inv.productId} | ${inv.name} | cat: ${inv.category} | created: ${inv.createdAt}`);
  }

  // 4. Orders count
  const orderCount = await db.collection('orders').countDocuments();
  console.log(`\n=== ORDERS: ${orderCount} total ===`);
  if (orderCount > 0) {
    const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(5).toArray();
    for (const o of orders) {
      console.log(`  ${o.orderId || o._id} | ${o.customer?.name || 'N/A'} | ${o.status} | ${o.createdAt}`);
    }
  }

  // 5. Check which inventories are missing from products
  const productIds = new Set(products.map(p => p.id));
  const inventoryIds = new Set(inventories.map(i => i.productId));
  
  console.log('\n=== MISSING FROM PRODUCTS (in inventories but not in products) ===');
  for (const inv of inventories) {
    if (!productIds.has(inv.productId)) {
      console.log(`  MISSING: ${inv.productId} | ${inv.name}`);
    }
  }
  
  console.log('\n=== EXTRA IN PRODUCTS (in products but not in inventories) ===');
  for (const p of products) {
    if (!inventoryIds.has(p.id)) {
      console.log(`  EXTRA: ${p.id} | ${p.name}`);
    }
  }

  // 6. List all databases
  const adminDb = db.admin();
  const dbList = await adminDb.listDatabases();
  console.log('\n=== DATABASES ON CLUSTER ===');
  for (const d of dbList.databases) {
    console.log(`  ${d.name}: ${(d.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
  }

  await mongoose.disconnect();
}

audit().catch(console.error);
