import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { getDb } from '../db.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { products } from '../../../src/data/products.js';

async function runMigration() {
  console.log('🚀 Initiating Phase 11 MongoDB Seed Migration...');
  
  try {
    const db = await getDb();
    const collection = db.collection('products');
    const auditRepo = new AuditRepository();
    
    let syncedCount = 0;
    
    for (const product of products) {
      // Upsert logic securing idempotency explicitly
      const result = await collection.updateOne(
        { id: product.id }, // Match strictly on Product local key
        { $set: product },  // Perform data payload overwrite
        { upsert: true }
      );
      
      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        syncedCount++;
        
        // Hook telemetry to capture state mutation
        await auditRepo.logAudit({
          actor: 'bot@system.internal',
          action: 'DB_MIGRATION',
          target: `product_v_1_${product.id}`,
          before: null,
          after: product
        });
        
        console.log(`✅ Replicated via Audit Trail: ${product.name} (UUID: ${product.id})`);
      } else {
        console.log(`➖ Skiping Sync: [${product.name}] is aligned and unchanged.`);
      }
    }
    
    console.log(`\n🎉 Security Hardening Concluded. Parsed ${products.length} targets. ${syncedCount} state modifications merged to main.`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ MIGRATION FAILED NATIVELY:', error);
    process.exit(1);
  }
}

runMigration();
