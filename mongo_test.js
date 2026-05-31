import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ No Mongo URI configured');
  process.exit(1);
}

mongoose.connect(uri, { dbName: 'stopshop' })
  .then(() => {
    console.log('✅ MongoDB connected (db: stopshop)');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
