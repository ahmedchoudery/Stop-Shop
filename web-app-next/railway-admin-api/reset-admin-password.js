import 'dotenv/config';
import { getDb } from './db.js';
import bcrypt from 'bcryptjs';

// Load root .env too
import { config as rootConfig } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load the root project .env as well
const __dirname = dirname(fileURLToPath(import.meta.url));
rootConfig({ path: resolve(__dirname, '../../.env'), override: false });

const db = await getDb();
const ADMIN_EMAIL = 'ahmedchoudery30@gmail.com';
const ADMIN_PASSWORD = process.env.admin_password;

if (!ADMIN_PASSWORD) {
  console.error('❌ admin_password not available');
  process.exit(1);
}

console.log(`Resetting password for ${ADMIN_EMAIL}...`);
const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

const result = await db.collection('admins').updateOne(
  { email: ADMIN_EMAIL },
  { 
    $set: { 
      password: hash,
      roles: ['super-admin'],
      name: 'Primary Owner'
    }
  },
  { upsert: true }
);

console.log('✅ Admin password reset! Result:', result.modifiedCount ? 'Updated' : 'Upserted');

// Verify it works
const admin = await db.collection('admins').findOne({ email: ADMIN_EMAIL });
const ok = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
console.log('Verification:', ok ? '✅ Password matches!' : '❌ Password mismatch');

process.exit(0);
