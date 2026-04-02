/**
 * @fileoverview scripts/sync-inventory.js
 *
 * One-time migration script.
 * Run once after deploying the updated server.js to populate
 * the `inventories` collection from all existing products.
 *
 * Usage:
 *   node scripts/sync-inventory.js
 *
 * After this runs, MongoDB will show 3 organized collections:
 *   - products     (master catalogue)
 *   - orders       (every customer purchase)
 *   - inventories  (stock management with movement history)
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
  console.error('❌ MONGO_URI missing from .env');
  process.exit(1);
}

// ── Minimal schemas needed for migration ──────────────────────────

const productSchema = new mongoose.Schema({
  id:          { type: String },
  name:        { type: String },
  price:       { type: Number },
  quantity:    { type: Number, default: 0 },
  stock:       { type: Number, default: 0 },
  image:       { type: String, default: '' },
  rating:      { type: Number, default: 5 },
  bucket:      { type: String, default: 'General' },
  subCategory: { type: String, default: 'General' },
  specs:       [String],
  colors:      [String],
  sizes:       [String],
  sizeStock:   { type: Map, of: Number, default: {} },
}, { timestamps: true, versionKey: false });

const inventoryMovementSchema = new mongoose.Schema({
  type:          { type: String },
  quantityDelta: { type: Number },
  previousStock: { type: Number },
  newStock:      { type: Number },
  note:          { type: String, default: '' },
  triggeredBy:   { type: String, default: 'system' },
  orderId:       { type: String, default: null },
  timestamp:     { type: Date, default: Date.now },
}, { _id: false });

const inventorySchema = new mongoose.Schema({
  productId:     { type: String, required: true, unique: true },
  sku:           { type: String, required: true },
  name:          { type: String, required: true },
  category:      { type: String, required: true },
  subCategory:   { type: String, required: true },
  price:         { type: Number, required: true },
  image:         { type: String, default: '' },
  rating:        { type: Number, default: 5 },
  colorVariants: [String],
  sizes:         [String],
  totalStock:    { type: Number, default: 0 },
  sizeStock:     { type: Map, of: Number, default: {} },
  lowStockThreshold: { type: Number, default: 5 },
  status:        { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
  lastRestocked: { type: Date, default: null },
  lastSold:      { type: Date, default: null },
  lastAdminEdit: { type: Date, default: null },
  movements:     [inventoryMovementSchema],
}, { timestamps: true, versionKey: false });

const Product   = mongoose.models.Product   || mongoose.model('Product',   productSchema);
const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

// ── Migration logic ────────────────────────────────────────────────

async function syncInventory(product, index, total) {
  const totalStock = product.quantity ?? 0;

  const status = totalStock === 0
    ? 'Out of Stock'
    : totalStock < 5
      ? 'Low Stock'
      : 'In Stock';

  const sizeStockPlain =
    product.sizeStock instanceof Map
      ? Object.fromEntries(product.sizeStock)
      : (typeof product.sizeStock?.toObject === 'function'
          ? product.sizeStock.toObject()
          : (product.sizeStock ?? {}));

  const movement = {
    type:          'INITIAL',
    quantityDelta: totalStock,
    previousStock: 0,
    newStock:      totalStock,
    note:          'Migrated from products collection via sync-inventory script',
    triggeredBy:   'system',
    orderId:       null,
    timestamp:     new Date(),
  };

  const result = await Inventory.findOneAndUpdate(
    { productId: product.id },
    {
      $set: {
        productId:    product.id,
        sku:          product.id,
        name:         product.name,
        category:     (product.bucket || 'General').trim(),
        subCategory:  (product.subCategory || 'General').trim(),
        price:        product.price,
        image:        product.image || '',
        rating:       product.rating ?? 5,
        colorVariants: product.colors ?? [],
        sizes:        product.sizes ?? [],
        totalStock,
        sizeStock:    sizeStockPlain,
        lowStockThreshold: 5,
        status,
        lastAdminEdit: product.updatedAt ?? new Date(),
      },
      $setOnInsert: {
        movements: [movement],
      },
    },
    { upsert: true, new: true }
  );

  const action = result.createdAt?.getTime() === result.updatedAt?.getTime() ? 'CREATED' : 'UPDATED';
  console.log(
    `  [${String(index + 1).padStart(4)}/${total}] ${action} | ${product.id} | "${product.name}" | ` +
    `Category: ${product.bucket || 'General'} | Stock: ${totalStock} | Status: ${status}`
  );
}

async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  Stop & Shop — Inventory Collection Migration');
  console.log('══════════════════════════════════════════════════════\n');

  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  console.log('✅ Connected to MongoDB (db: stopshop)\n');

  const products = await Product.find({}).lean();
  console.log(`📦 Found ${products.length} products to sync...\n`);

  if (products.length === 0) {
    console.log('ℹ️  No products found. Seed your products first, then re-run this script.');
    process.exit(0);
  }

  let created = 0;
  let updated = 0;
  let errored = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Skip products with no ID (shouldn't happen, but be safe)
    if (!product.id) {
      console.warn(`  ⚠️  Skipping product with missing id: ${product._id}`);
      errored++;
      continue;
    }

    try {
      const before = await Inventory.findOne({ productId: product.id }).lean();
      await syncInventory(product, i, products.length);
      const after  = await Inventory.findOne({ productId: product.id }).lean();

      // Determine if it was created or updated based on createdAt
      if (!before) created++;
      else updated++;

    } catch (err) {
      console.error(`  ❌ Failed for product ${product.id}:`, err.message);
      errored++;
    }
  }

  // ── Print summary ──────────────────────────────────────────────

  const inStock  = await Inventory.countDocuments({ status: 'In Stock' });
  const lowStock = await Inventory.countDocuments({ status: 'Low Stock' });
  const outStock = await Inventory.countDocuments({ status: 'Out of Stock' });
  const total    = await Inventory.countDocuments();

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  Migration Complete');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  Products processed : ${products.length}`);
  console.log(`  Inventory created  : ${created}`);
  console.log(`  Inventory updated  : ${updated}`);
  console.log(`  Errors             : ${errored}`);
  console.log('');
  console.log(`  Total inventory entries : ${total}`);
  console.log(`  ✅ In Stock             : ${inStock}`);
  console.log(`  ⚠️  Low Stock            : ${lowStock}`);
  console.log(`  ❌ Out of Stock          : ${outStock}`);
  console.log('\n  MongoDB collections now organized:');
  console.log('  📁 stopshop.products    — master product catalogue');
  console.log('  📁 stopshop.orders      — customer orders with full snapshots');
  console.log('  📁 stopshop.inventories — stock management with movement history');
  console.log('══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});