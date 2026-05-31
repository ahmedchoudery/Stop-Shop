import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is missing');
  process.exit(1);
}

const productSchema = new mongoose.Schema({
  id: String,
  name: String,
  image: String,
  gallery: [String],
  mediaType: String,
  colors: [String],
  variantImages: Map,
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function check() {
  await mongoose.connect(MONGO_URI, { dbName: 'stopshop' });
  const products = await Product.find().lean();
  console.log('Total products:', products.length);
  products.forEach(p => {
    console.log(`Product ID: ${p.id}, Name: ${p.name}`);
    console.log(`  JSON stringified variantImages:`, JSON.stringify(p.variantImages));
    console.log(`  image: "${p.image}"`);
    console.log(`  gallery:`, p.gallery);
    console.log(`  mediaType: "${p.mediaType}"`);
    console.log(`  colors:`, p.colors);
    console.log(`  variantImages:`, p.variantImages);
    console.log('--------------------------------------------------');
  });
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
