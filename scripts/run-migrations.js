import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

function slugify(name, id) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + id;
}

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI/MONGODB_URI not defined');
  }

  console.log('Connecting to database for migrations...');
  await mongoose.connect(uri, { dbName: 'stopshop' });
  const db = mongoose.connection.db;

  // 1. Migrate Products (slug & categories)
  console.log('\n--- Migrating Products ---');
  const ProductSchema = new mongoose.Schema({}, { strict: false });
  const Product = mongoose.models.ProductMigration || mongoose.model('ProductMigration', ProductSchema, 'products');
  
  const products = await Product.find({}).lean();
  console.log(`Found ${products.length} products to check.`);

  for (const p of products) {
    const updates = {};
    if (!p.slug) {
      updates.slug = slugify(p.name || 'product', p.id);
    }
    if (!p.categories || p.categories.length === 0) {
      const cats = [];
      if (p.bucket) cats.push(p.bucket);
      if (p.subCategory) cats.push(p.subCategory);
      updates.categories = cats;
    }

    if (Object.keys(updates).length > 0) {
      await Product.updateOne({ _id: p._id }, { $set: updates });
      console.log(`Updated product ${p.id}: ${JSON.stringify(updates)}`);
    }
  }

  // 2. Build indexes
  console.log('\n--- Creating Indexes ---');

  // orders: userId, createdAt desc & status, createdAt
  console.log('Creating indexes on orders...');
  await db.collection('orders').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('orders').createIndex({ status: 1, createdAt: 1 });

  // products: slug unique & categories
  console.log('Creating indexes on products...');
  try {
    await db.collection('products').dropIndex('slug_1');
  } catch (e) {
    // Ignore if index doesn't exist
  }
  await db.collection('products').createIndex({ slug: 1 }, { unique: true });
  await db.collection('products').createIndex({ categories: 1 });

  // inventories: sku unique
  console.log('Creating index on inventories...');
  try {
    await db.collection('inventories').dropIndex('sku_1');
  } catch (e) {
    // Ignore if index doesn't exist
  }
  await db.collection('inventories').createIndex({ sku: 1 }, { unique: true });

  // users: email unique with case-insensitive collation
  console.log('Creating case-insensitive index on users...');
  try {
    await db.collection('users').dropIndex('email_1');
  } catch (e) {
    // Ignore if index doesn't exist
  }
  try {
    await db.collection('users').dropIndex('users_email_unique_ci');
  } catch (e) {
    // Ignore if index doesn't exist
  }
  
  await db.collection('users').createIndex(
    { email: 1 },
    {
      unique: true,
      collation: { locale: 'en', strength: 2 },
      name: 'users_email_unique_ci'
    }
  );

  // refreshtokens: tokenHash unique
  console.log('Creating unique index on refreshtokens...');
  try {
    await db.collection('refreshtokens').dropIndex('tokenHash_1');
  } catch (e) {
    // Ignore if index doesn't exist
  }
  await db.collection('refreshtokens').createIndex({ tokenHash: 1 }, { unique: true });

  // auditlogs: actorUserId, at desc
  console.log('Creating index on auditlogs...');
  await db.collection('auditlogs').createIndex({ actorUserId: 1, at: -1 });

  console.log('\nMigrations completed successfully!');
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
