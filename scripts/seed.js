import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { products } from '../src/data/products.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI or MONGODB_URI is not defined in .env');
  process.exit(1);
}

const productSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  image: { type: String, default: '' },
  mediaType: { type: String, enum: ['upload', 'url', 'embed'], default: 'upload' },
  embedCode: { type: String, default: '' },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  bucket: { type: String, default: 'Tops' },
  subCategory: { type: String, default: 'General' },
  specs: [{ type: String }],
  colors: [{ type: String }],
  sizes: [{ type: String }],
  sizeStock: { type: Map, of: Number, default: {} },
  lifestyleImage: { type: String, default: '' },
  variantImages: { type: Map, of: String, default: {} },
  gallery: [{ type: String }],
}, { timestamps: true, versionKey: false });

const Product = mongoose.model('Product', productSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Cleaning existing products...');
    await Product.deleteMany({});
    console.log('Cleaned.');

    console.log(`Inserting ${products.length} products...`);
    
    // Transform data to match schema if necessary (e.g., converting id to string)
    const preparedProducts = products.map(p => ({
      ...p,
      id: p.id.toString(), // ensure id is string as per schema
      mediaType: 'url',    // since they are Unsplash URLs
      stock: p.stock ?? 0,
      quantity: p.stock ?? 0,
    }));

    await Product.insertMany(preparedProducts);
    console.log('Seeding successful!');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seed();
