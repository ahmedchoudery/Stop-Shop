import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI;
const email = process.env.admin_email || 'admin@stopshop.com';
const password = process.env.admin_password || 'admin123';

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  roles: [String],
  isPrimary: Boolean
});
const Admin = mongoose.model('Admin', adminSchema);

async function checkAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const count = await Admin.countDocuments();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({
        name: 'Super Admin',
        email: email,
        password: hashedPassword,
        roles: ['super-admin'],
        isPrimary: true
      });
      await newAdmin.save();
      console.log(`Created admin: ${email}`);
    } else {
      console.log(`Found ${count} admin(s).`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

checkAdmin();
