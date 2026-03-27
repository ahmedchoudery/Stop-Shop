import 'dotenv/config';
import { getDb } from './db.js';
import bcrypt from 'bcryptjs';

const db = await getDb();
const admin = await db.collection('admins').findOne({ email: 'ahmedchoudery30@gmail.com' });

if (!admin) {
  console.log('❌ No admin found with that email');
  process.exit(1);
}

console.log('✅ Admin found:', { email: admin.email, name: admin.name, roles: admin.roles });

// Test the exact password from .env
const password = process.env.admin_password;
console.log('Password from .env:', JSON.stringify(password));

if (password) {
  const match = await bcrypt.compare(password, admin.password);
  console.log('Password match:', match);
} else {
  console.log('⚠️  admin_password env var not set');
}

process.exit(0);
