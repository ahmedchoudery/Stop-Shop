/**
 * @fileoverview Stop & Shop — MongoDB Database Repair & Integrity Script
 *
 * What this does:
 *  1. Verifies connection to the correct database: stopshop
 *  2. Lists all existing databases/collections — flags any junk ones
 *  3. Drops all collections that don't belong to Stop & Shop
 *  4. Ensures every product has a valid `id` field (used as SKU)
 *  5. Ensures `quantity` and `stock` are always in sync on every product
 *  6. Re-builds the entire inventories collection from products (full resync)
 *  7. Ensures all orders have `customer.name` (not firstName+lastName split)
 *  8. Removes orphaned inventory entries (products that no longer exist)
 *  9. Ensures the CARDINAL20 coupon exists
 * 10. Rebuilds all MongoDB indexes
 * 11. Prints a clean health report at the end
 *
 * Run with:
 *   node scripts/db-repair.js
 *
 * Requires MONGO_URI or MONGODB_URI in .env
 */

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
// SCHEMAS (minimal — just enough to query and update)
// ─────────────────────────────────────────────────────────────────

const productSchema = new mongoose.Schema({
  id:          { type: String, unique: true, index: true },
  name:        { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  quantity:    { type: Number, default: 0, min: 0 },
  stock:       { type: Number, default: 0, min: 0 },
  image:       { type: String, default: '' },
  mediaType:   { type: String, default: 'url' },
  embedCode:   { type: String, default: '' },
  rating:      { type: Number, default: 5 },
  bucket:      { type: String, default: 'Tops' },
  subCategory: { type: String, default: 'General' },
  specs:       [{ type: String }],
  colors:      [{ type: String }],
  sizes:       [{ type: String }],
  sizeStock:   { type: Map, of: Number, default: {} },
  lifestyleImage: { type: String, default: '' },
  variantImages:  { type: Map, of: String, default: {} },
  gallery:     [{ type: String }],
}, { timestamps: true, versionKey: false });

const inventorySchema = new mongoose.Schema({
  productId:     { type: String, required: true, unique: true, index: true },
  sku:           { type: String, required: true },
  name:          { type: String, required: true },
  category:      { type: String, required: true },
  subCategory:   { type: String, required: true },
  price:         { type: Number, required: true },
  image:         { type: String, default: '' },
  rating:        { type: Number, default: 5 },
  colorVariants: [{ type: String }],
  sizes:         [{ type: String }],
  totalStock:    { type: Number, default: 0 },
  sizeStock:     { type: Map, of: Number, default: {} },
  lowStockThreshold: { type: Number, default: 5 },
  status:        { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
  lastRestocked: { type: Date, default: null },
  lastSold:      { type: Date, default: null },
  lastAdminEdit: { type: Date, default: null },
  movements:     { type: Array, default: [] },
}, { timestamps: true, versionKey: false });

const orderSchema = new mongoose.Schema({
  orderID:  { type: String },
  customer: {
    name:    String,
    email:   String,
    address: String,
    city:    String,
    zip:     String,
    firstName: String, // legacy field — will be merged
    lastName:  String, // legacy field — will be merged
  },
  items:         Array,
  total:         Number,
  paymentMethod: String,
  status:        { type: String, default: 'Pending' },
  ip:            String,
}, { timestamps: true, versionKey: false });

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true },
  type:          { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value:         { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxUses:       { type: Number, default: null },
  usedCount:     { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
  expiresAt:     { type: Date, default: null },
}, { timestamps: true, versionKey: false });

// ─────────────────────────────────────────────────────────────────
// VALID COLLECTIONS for Stop & Shop
// Any collection NOT in this list will be flagged for deletion
// ─────────────────────────────────────────────────────────────────

const VALID_COLLECTIONS = new Set([
  'products',
  'orders',
  'inventories',
  'admins',
  'settings',
  'auditlogs',
  'subscribers',
  'coupons',
  'reviews',
  'customers',
]);

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const log    = (msg) => console.log(`  ✅ ${msg}`);
const warn   = (msg) => console.warn(`  ⚠️  ${msg}`);
const err    = (msg) => console.error(`  ❌ ${msg}`);
const header = (msg) => console.log(`\n${'─'.repeat(60)}\n  ${msg}\n${'─'.repeat(60)}`);

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🔧 Stop & Shop — MongoDB Database Repair Tool\n');

  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  log('Connected to MongoDB Atlas — database: stopshop');

  const db = mongoose.connection.db;
  const Product   = mongoose.model('Product',   productSchema);
  const Inventory = mongoose.model('Inventory', inventorySchema);
  const Order     = mongoose.model('Order',     orderSchema);
  const Coupon    = mongoose.model('Coupon',    couponSchema);

  const report = {
    productsFixed: 0,
    inventoriesRebilt: 0,
    inventoriesOrphaned: 0,
    ordersFixed: 0,
    collectionsDropped: 0,
    indexesRebuilt: 0,
  };

  // ── STEP 1: Collection audit ─────────────────────────────────
  header('STEP 1 — Collection Audit');

  const collections = await db.listCollections().toArray();
  const colNames = collections.map(c => c.name);
  console.log(`  Found ${colNames.length} collections: ${colNames.join(', ')}`);

  const junk = colNames.filter(name => !VALID_COLLECTIONS.has(name));

  if (junk.length === 0) {
    log('All collections are valid — no cleanup needed');
  } else {
    for (const name of junk) {
      warn(`Unknown collection: "${name}" — dropping it`);
      await db.collection(name).drop();
      report.collectionsDropped++;
      log(`Dropped collection: ${name}`);
    }
  }

  // Check for wrong database (stop-shop vs stopshop)
  const allDbs = await db.admin().listDatabases();
  const wrongDb = allDbs.databases.find(d => d.name === 'stop-shop');
  if (wrongDb) {
    warn('"stop-shop" database found — this is the old wrong database. Run scripts/migrate-db.js to migrate it.');
  }

  // ── STEP 2: Fix Products ──────────────────────────────────────
  header('STEP 2 — Product Integrity Check & Fix');

  const products = await Product.find().lean();
  console.log(`  Found ${products.length} products`);

  for (const p of products) {
    const updates = {};
    let needsUpdate = false;

    // 2a. Ensure `id` field exists (SKU)
    if (!p.id) {
      const newId = `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      updates.id = newId;
      needsUpdate = true;
      warn(`Product "${p.name}" (${p._id}) has no id — assigning ${newId}`);
    }

    // 2b. Sync quantity ↔ stock
    if (p.quantity !== p.stock) {
      const correct = Math.max(p.quantity ?? 0, p.stock ?? 0);
      updates.quantity = correct;
      updates.stock    = correct;
      needsUpdate = true;
      warn(`Product "${p.name}" — quantity(${p.quantity}) ≠ stock(${p.stock}) → setting both to ${correct}`);
    }

    // 2c. Recalculate quantity from sizeStock if sizeStock exists
    if (p.sizeStock && typeof p.sizeStock === 'object') {
      const sizeValues = p.sizeStock instanceof Map
        ? [...p.sizeStock.values()]
        : Object.values(p.sizeStock);

      if (sizeValues.length > 0) {
        const sizeTotal = sizeValues.reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
        if (sizeTotal !== p.quantity) {
          updates.quantity = sizeTotal;
          updates.stock    = sizeTotal;
          needsUpdate = true;
          warn(`Product "${p.name}" — sizeStock sum(${sizeTotal}) ≠ quantity(${p.quantity}) → correcting`);
        }
      }
    }

    // 2d. Trim bucket and subCategory
    const trimmedBucket = (p.bucket || 'Tops').trim();
    const trimmedSub    = (p.subCategory || 'General').trim();
    if (p.bucket !== trimmedBucket || p.subCategory !== trimmedSub) {
      updates.bucket      = trimmedBucket;
      updates.subCategory = trimmedSub;
      needsUpdate = true;
    }

    // 2e. Ensure price is a positive number
    if (typeof p.price !== 'number' || isNaN(p.price) || p.price < 0) {
      updates.price = 0;
      needsUpdate = true;
      warn(`Product "${p.name}" has invalid price: ${p.price} → setting to 0`);
    }

    if (needsUpdate) {
      await db.collection('products').updateOne(
        { _id: p._id },
        { $set: updates }
      );
      report.productsFixed++;
    }
  }

  log(`Product check complete — ${report.productsFixed} products fixed, ${products.length - report.productsFixed} were already clean`);

  // ── STEP 3: Rebuild Inventories ───────────────────────────────
  header('STEP 3 — Inventory Full Resync');

  // Reload products after fixes
  const freshProducts = await Product.find().lean();

  for (const p of freshProducts) {
    const productId = p.id || p._id.toString();

    const sizeStockPlain =
      p.sizeStock instanceof Map
        ? Object.fromEntries(p.sizeStock)
        : (p.sizeStock ?? {});

    const totalStock = p.quantity ?? 0;
    const status =
      totalStock === 0 ? 'Out of Stock' :
      totalStock < 5   ? 'Low Stock' :
                         'In Stock';

    // Fetch existing to preserve movement history and timestamps
    const existing = await Inventory.findOne({ productId }).lean();

    await db.collection('inventories').updateOne(
      { productId },
      {
        $set: {
          productId,
          sku:           productId,
          name:          p.name,
          category:      p.bucket || 'General',
          subCategory:   p.subCategory || 'General',
          price:         p.price,
          image:         p.image || '',
          rating:        p.rating ?? 5,
          colorVariants: p.colors ?? [],
          sizes:         p.sizes ?? [],
          totalStock,
          sizeStock:     sizeStockPlain,
          status,
          lowStockThreshold: 5,
          // Preserve existing timestamps if they exist
          ...(existing?.lastRestocked ? {} : { lastRestocked: null }),
          ...(existing?.lastSold      ? {} : { lastSold: null }),
          lastAdminEdit: new Date(),
        },
        // Only add initial movement if this is a brand new inventory doc
        ...(existing ? {} : {
          $push: {
            movements: {
              type: 'INITIAL',
              quantityDelta: totalStock,
              previousStock: 0,
              newStock: totalStock,
              note: 'Database repair — inventory initialized from product',
              triggeredBy: 'system',
              orderId: null,
              timestamp: new Date(),
            },
          },
        }),
      },
      { upsert: true }
    );

    report.inventoriesRebilt++;
  }

  log(`Inventory resync complete — ${report.inventoriesRebilt} entries rebuilt`);

  // ── STEP 4: Remove orphaned inventory entries ─────────────────
  header('STEP 4 — Orphaned Inventory Cleanup');

  const productIds   = new Set(freshProducts.map(p => p.id || p._id.toString()));
  const allInventory = await Inventory.find().lean();

  for (const inv of allInventory) {
    if (!productIds.has(inv.productId)) {
      await db.collection('inventories').deleteOne({ _id: inv._id });
      report.inventoriesOrphaned++;
      warn(`Removed orphaned inventory: "${inv.name}" (productId: ${inv.productId})`);
    }
  }

  if (report.inventoriesOrphaned === 0) {
    log('No orphaned inventory entries found');
  } else {
    log(`Removed ${report.inventoriesOrphaned} orphaned inventory entries`);
  }

  // ── STEP 5: Fix Order customer.name field ─────────────────────
  header('STEP 5 — Order Customer Name Fix');

  const orders = await Order.find().lean();
  console.log(`  Found ${orders.length} orders`);

  for (const order of orders) {
    const updates = {};
    let needsUpdate = false;

    // Fix: some old orders stored firstName+lastName separately
    if (!order.customer?.name && (order.customer?.firstName || order.customer?.lastName)) {
      const fullName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
      updates['customer.name'] = fullName || 'Unknown Customer';
      needsUpdate = true;
      warn(`Order ${order.orderID} — merging firstName+lastName → "${updates['customer.name']}"`);
    }

    // Fix: ensure orderID exists
    if (!order.orderID) {
      updates.orderID = `ORD-${order._id.toString().slice(-8).toUpperCase()}`;
      needsUpdate = true;
      warn(`Order ${order._id} — missing orderID → assigned ${updates.orderID}`);
    }

    // Fix: ensure status is valid
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(order.status)) {
      updates.status = 'Pending';
      needsUpdate = true;
      warn(`Order ${order.orderID} — invalid status "${order.status}" → Pending`);
    }

    if (needsUpdate) {
      await db.collection('orders').updateOne({ _id: order._id }, { $set: updates });
      report.ordersFixed++;
    }
  }

  log(`Order check complete — ${report.ordersFixed} orders fixed`);

  // ── STEP 6: Ensure CARDINAL20 coupon ─────────────────────────
  header('STEP 6 — Coupon Check');

  const cardinal20 = await Coupon.findOne({ code: 'CARDINAL20' }).lean();
  if (!cardinal20) {
    await Coupon.create({
      code: 'CARDINAL20',
      type: 'percentage',
      value: 20,
      minOrderValue: 0,
      maxUses: null,
      usedCount: 0,
      isActive: true,
      expiresAt: null,
    });
    log('Created CARDINAL20 coupon (20% off, unlimited)');
  } else {
    log(`CARDINAL20 coupon exists — used ${cardinal20.usedCount} time(s)`);
  }

  // ── STEP 7: Rebuild indexes ───────────────────────────────────
  header('STEP 7 — Index Rebuild');

  const safeDropIndex = async (collectionName, indexName) => {
    try {
      await db.collection(collectionName).dropIndex(indexName);
      log(`Dropped existing index ${indexName} on ${collectionName}`);
    } catch (err) {
      // Ignore if index doesn't exist
    }
  };

  // Products
  await safeDropIndex('products', 'id_1');
  await db.collection('products').createIndex({ id: 1 }, { unique: true, sparse: true });
  await db.collection('products').createIndex({ bucket: 1, createdAt: -1 });
  log('Products indexes ready');

  // Orders
  await safeDropIndex('orders', 'orderID_1');
  await db.collection('orders').createIndex({ orderID: 1 }, { unique: true, sparse: true });
  await db.collection('orders').createIndex({ status: 1, createdAt: -1 });
  await db.collection('orders').createIndex({ 'customer.email': 1 });
  log('Orders indexes ready');

  // Inventories
  await safeDropIndex('inventories', 'productId_1');
  await db.collection('inventories').createIndex({ productId: 1 }, { unique: true });
  await db.collection('inventories').createIndex({ status: 1 });
  await db.collection('inventories').createIndex({ category: 1, totalStock: 1 });
  log('Inventories indexes ready');

  // Reviews
  await db.collection('reviews').createIndex({ status: 1, createdAt: -1 });
  await db.collection('reviews').createIndex({ productId: 1, status: 1 });
  log('Reviews indexes ready');

  // Coupons
  await safeDropIndex('coupons', 'code_1');
  await db.collection('coupons').createIndex({ code: 1 }, { unique: true });
  log('Coupons indexes ready');

  // Admins
  await safeDropIndex('admins', 'email_1');
  await db.collection('admins').createIndex({ email: 1 }, { unique: true });
  log('Admins indexes ready');

  // Customers
  await safeDropIndex('customers', 'email_1');
  await db.collection('customers').createIndex({ email: 1 }, { unique: true, sparse: true });
  log('Customers indexes ready');

  // Subscribers
  await safeDropIndex('subscribers', 'email_1');
  await db.collection('subscribers').createIndex({ email: 1 }, { unique: true, sparse: true });
  log('Subscribers indexes ready');

  report.indexesRebuilt = 8;

  // ── FINAL REPORT ─────────────────────────────────────────────
  header('✅ REPAIR COMPLETE — Health Report');

  // Count documents in each collection
  const finalCounts = {};
  const expectedCollections = [...VALID_COLLECTIONS];

  for (const col of expectedCollections) {
    try {
      finalCounts[col] = await db.collection(col).countDocuments();
    } catch {
      finalCounts[col] = 0;
    }
  }

  console.log('\n  📊 Collection Document Counts:');
  for (const [col, count] of Object.entries(finalCounts)) {
    const status = count > 0 ? '✅' : '⚪';
    console.log(`     ${status} ${col.padEnd(18)} ${count} documents`);
  }

  console.log('\n  🔧 Repair Actions Taken:');
  console.log(`     • Products fixed:           ${report.productsFixed}`);
  console.log(`     • Inventory entries rebuilt: ${report.inventoriesRebilt}`);
  console.log(`     • Orphaned inv. removed:     ${report.inventoriesOrphaned}`);
  console.log(`     • Orders fixed:              ${report.ordersFixed}`);
  console.log(`     • Junk collections dropped:  ${report.collectionsDropped}`);
  console.log(`     • Index sets rebuilt:        ${report.indexesRebuilt}`);

  // Inventory health summary
  const invSummary = await db.collection('inventories').aggregate([
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalUnits: { $sum: '$totalStock' },
    }},
  ]).toArray();

  console.log('\n  📦 Inventory Health:');
  for (const s of invSummary) {
    const icon = s._id === 'In Stock' ? '🟢' : s._id === 'Low Stock' ? '🟡' : '🔴';
    console.log(`     ${icon} ${s._id.padEnd(15)} ${s.count} products | ${s.totalUnits} total units`);
  }

  console.log('\n  Your MongoDB Atlas database is now clean, indexed, and consistent.');
  console.log('  Redeploy to Railway to pick up any changes.\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(e => {
  console.error('\n❌ Fatal error during repair:', e.message);
  console.error(e.stack);
  process.exit(1);
});