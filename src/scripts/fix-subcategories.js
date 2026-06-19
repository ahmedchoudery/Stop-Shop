/**
 * @fileoverview One-time migration: normalise all product subCategory values
 * to canonical plural forms (matching categories.js frontend).
 *
 * Run once: node src/scripts/fix-subcategories.js
 * Or: npx tsx src/scripts/fix-subcategories.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';

// ── Singular → Plural migration map ────────────────────────────────────────
const SINGULAR_TO_PLURAL = {
  // Tops
  'Shirt':       'Shirts',
  'T-Shirt':     'T-Shirts',
  'Tshirt':      'T-Shirts',
  'Tshirts':     'T-Shirts',
  'Polo':        'Polos',
  'Sweatshirt':  'Sweatshirts',
  'Hoodie':      'Hoodies',
  'Jacket':      'Jackets',
  'Tank-Top':    'Tank-Tops',
  'Tank Top':    'Tank-Tops',
  'Tank Tops':   'Tank-Tops',
  // Bottoms — already plural
  // Footwear — already plural
  // Accessories
  'Glasses':     null,   // no plural equivalent; map to Caps or skip
  'Watch':       'Watches',
  'Ring':        null,   // not in canonical list
  'Bracelet':    null,   // not in canonical list
  'Chain':       'Chains',
  'Cap':         'Caps',
  'Belt':        null,   // not in canonical list
  'Bag':         'Bags',
};

// Canonical valid subCategories
const VALID_SUBCATEGORIES = new Set([
  'Shirts', 'T-Shirts', 'Polos', 'Sweatshirts', 'Hoodies', 'Jackets', 'Tank-Tops',
  'Jeans', 'Trousers', 'Shorts',
  'Shoes', 'Slippers', 'Socks',
  'Watches', 'Chains', 'Bags', 'Caps',
  'Outfit',
]);

// Bucket-default fallbacks
const BUCKET_DEFAULTS = {
  Tops:        'Shirts',
  Bottoms:     'Jeans',
  Footwear:    'Shoes',
  Accessories: 'Watches',
  Outfit:      'Outfit',
};

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not set in environment');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const col = db.collection('products');

  const products = await col.find({}).toArray();
  console.log(`📦  Found ${products.length} products\n`);

  let fixed = 0;
  let skipped = 0;

  for (const p of products) {
    const currentSub = p.subCategory;
    const bucket     = p.bucket || 'Tops';

    // Already canonical?
    if (VALID_SUBCATEGORIES.has(currentSub)) {
      skipped++;
      continue;
    }

    // Try the singular-to-plural map
    let newSub = SINGULAR_TO_PLURAL[currentSub];

    // If mapped to null (deprecated category) or not found, use bucket default
    if (!newSub) {
      newSub = BUCKET_DEFAULTS[bucket] || 'Shirts';
    }

    console.log(`  ➤  "${p.name}" | subCategory: "${currentSub}" → "${newSub}" (bucket: ${bucket})`);
    await col.updateOne(
      { _id: p._id },
      { $set: { subCategory: newSub, updatedAt: new Date() } }
    );
    fixed++;
  }

  console.log(`\n✅  Migration complete: ${fixed} products updated, ${skipped} already canonical.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
