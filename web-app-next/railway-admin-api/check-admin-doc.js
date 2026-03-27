import 'dotenv/config';
import { config as rootConfig } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
rootConfig({ path: resolve(__dirname, '../../.env'), override: false });

import { getDb } from './db.js';

const db = await getDb();
const admin = await db.collection('admins').findOne({ email: 'ahmedchoudery30@gmail.com' });

if (!admin) {
  console.log('No admin found');
} else {
  console.log('Full admin document keys:', Object.keys(admin));
  console.log('Password field present:', 'password' in admin);
  console.log('Hash value (truncated):', admin.password?.slice(0, 20) || 'MISSING');
}
process.exit(0);
