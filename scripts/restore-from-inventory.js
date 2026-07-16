import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const db = mongoose.connection.db;

  const inventories = await db.collection('inventories').find().toArray();
  console.log(`Found ${inventories.length} inventories.`);

  let restoredCount = 0;
  for (const inv of inventories) {
    const productId = inv.productId || inv.sku;
    if (!productId) continue;

    // Delete if existing to ensure a clean sync of fields
    await db.collection('products').deleteOne({ id: productId });

    const sizeStockPlain = inv.sizeStock || {};
    const sizesList = Object.keys(sizeStockPlain);

    // Map fields from inventory to product schema
    const productDoc = {
      id: productId,
      name: inv.name,
      price: inv.price,
      quantity: inv.totalStock || 0,
      stock: inv.totalStock || 0,
      image: inv.image || '',
      mediaType: 'upload',
      embedCode: '',
      rating: inv.rating || 5,
      bucket: inv.category || 'Tops',
      subCategory: inv.subCategory || 'Shirts',
      specs: [],
      colors: inv.colorVariants || [],
      sizes: inv.sizes && inv.sizes.length > 0 ? inv.sizes : sizesList,
      sizeStock: sizeStockPlain,
      colorStock: inv.colorStock || {},
      variantMatrix: inv.variantMatrix || {},
      lifestyleImage: '',
      variantImages: inv.variantImages || {},
      gallery: inv.gallery || [],
      featuredSection: inv.featuredSection || 'collection',
      sectionName: inv.sectionName || 'Collection',
      displayOrder: inv.displayOrder || 0,
      discount: inv.discount || 0,
      description: inv.description || '',
      careInstructions: inv.careInstructions || '',
      createdAt: inv.createdAt || new Date(),
      updatedAt: inv.updatedAt || new Date()
    };

    // Auto-generate slug if not present
    productDoc.slug = inv.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + productId.toLowerCase();

    await db.collection('products').insertOne(productDoc);
    console.log(`Restored product ${productId}: "${inv.name}"`);
    restoredCount++;
  }

  console.log(`Successfully restored ${restoredCount} products from inventories.`);
  await mongoose.disconnect();
}

run().catch(console.error);
