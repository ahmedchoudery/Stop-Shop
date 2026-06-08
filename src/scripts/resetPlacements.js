import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in env variables');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const collection = mongoose.connection.db.collection('products');

    const products = await collection.find({}).toArray();
    console.log(`Total products in DB: ${products.length}`);
    products.forEach(p => {
      console.log(`- ${p.name}: featuredSection=${p.featuredSection}, displayOrder=${p.displayOrder}`);
    });

    const result = await collection.updateMany(
      { featuredSection: { $in: ['drop', 'pieces', 'attitude'] } },
      { $set: { featuredSection: 'collection', displayOrder: 0 } }
    );

    console.log(`Successfully reset ${result.modifiedCount} products to 'collection' section.`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting placements:', error);
    process.exit(1);
  }
}

run();
