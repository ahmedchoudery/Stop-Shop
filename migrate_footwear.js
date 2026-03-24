import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

const productSchema = new mongoose.Schema({
  id: String,
  bucket: String,
  subCategory: String,
}, { strict: false });

const Product = mongoose.model('ProductMigration', productSchema, 'products');

async function run() {
  try {
    const result = await Product.updateMany(
      { bucket: "Accessories", subCategory: "Footwear" },
      { $set: { bucket: "Footwear", subCategory: "Shoes" } }
    );
    console.log(`Updated ${result.modifiedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
run();
