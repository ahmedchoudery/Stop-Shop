import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ No MONGO_URI found in .env");
  process.exit(1);
}

const performMigration = async () => {
  try {
    console.log("🔌 Connecting to MongoDB cluster...");
    // Connect to cluster (no specific db)
    await mongoose.connect(uri);
    
    // Get the two databases
    const wrongDb = mongoose.connection.client.db('stop-shop');
    const rightDb = mongoose.connection.client.db('stopshop');

    console.log("📂 Databases acquired.");

    // Fetch documents from wrong database
    const wrongProducts = await wrongDb.collection('products').find({}).toArray();
    console.log(`📦 Found ${wrongProducts.length} products in wrong 'stop-shop' database.`);

    if (wrongProducts.length > 0) {
      console.log("🔄 Migrating products to 'stopshop'...");
      
      // We only insert if we haven't already inserted
      for (const prod of wrongProducts) {
        const exists = await rightDb.collection('products').findOne({ _id: prod._id });
        if (!exists) {
          await rightDb.collection('products').insertOne(prod);
          console.log(`✅ Migrated product: ${prod.name || prod.id}`);
        } else {
          console.log(`⚠️ Product ${prod.name || prod.id} already exists in target DB. Skipping.`);
        }
      }
    }

    // Now safely DROP the wrong database
    console.log("🗑️ Dropping the duplicate 'stop-shop' database...");
    await wrongDb.dropDatabase();
    console.log("💥 'stop-shop' database permanently deleted!");

    console.log("🎉 Migration perfectly completed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

performMigration();
