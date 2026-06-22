import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id:            { type: String, unique: true, index: true },
  name:          { type: String, required: true, trim: true },
  price:         { type: Number, required: true, min: 0 },
  quantity:      { type: Number, default: 0, min: 0 },  // total available
  stock:         { type: Number, default: 0, min: 0 },  // mirrors quantity
  image:         { type: String, default: '' },
  mediaType:     { type: String, enum: ['upload', 'url', 'embed'], default: 'upload' },
  embedCode:     { type: String, default: '' },
  rating:        { type: Number, default: 5, min: 1, max: 5 },
  bucket:        {
    type: String,
    enum: ['Tops', 'Bottoms', 'Footwear', 'Accessories', 'Outfit'],
    default: 'Tops',
    trim: true
  },
  subCategory:   {
    type: String,
    validate: {
      validator: function(v) {
        // Canonical plural-only list — matches categories.js frontend exactly
        const CATEGORY_MAP = {
          Tops:        ['Shirts', 'T-Shirts', 'Polos', 'Sweatshirts', 'Hoodies', 'Jackets', 'Tank-Tops'],
          Bottoms:     ['Jeans', 'Trousers', 'Shorts'],
          Footwear:    ['Shoes', 'Slippers', 'Socks'],
          Accessories: ['Watches', 'Chains', 'Bags', 'Caps'],
          Outfit:      ['Outfit'],
        };
        // If there's a bucket defined, validate against that bucket's options, otherwise allow any from all buckets
        if (this.bucket && CATEGORY_MAP[this.bucket]) {
          return CATEGORY_MAP[this.bucket].includes(v);
        }
        return Object.values(CATEGORY_MAP).flat().includes(v);
      },
      message: props => `"${props.value}" is not a valid subCategory for the selected category!`
    },
    default: 'Shirts',
    trim: true
  },
  specs:         [{ type: String }],
  colors:        [{ type: String }],
  sizes:         [{ type: String }],
  sizeStock:     { type: Map, of: Number, default: {} },      // { S: 10, M: 5 }  — used when sizes only
  colorStock:    { type: Map, of: Number, default: {} },      // { White: 30 }     — used when colors only
  variantMatrix: { type: Map, of: Number, default: {} },      // { 'Red|S': 5, 'Red|M': 3, 'Blue|S': 4 } — used when both colors AND sizes
  lifestyleImage: { type: String, default: '' },
  variantImages: { type: Map, of: String, default: {} },  // { 'Red': 'url', 'Blue': 'url' }
  gallery:       [{ type: String }],
  featuredSection: { type: String, enum: ['collection', 'drop', 'attitude', 'pieces'], required: true },
  sectionName:     { type: String, default: 'Collection' },
  displayOrder:    { type: Number, default: 0, min: 0 },
  discount:        { type: Number, default: 0, min: 0, max: 100 },
  description:     { type: String, default: '' },
  careInstructions: { type: String, default: '' },
}, { timestamps: true, versionKey: false, autoIndex: true });

productSchema.index({ bucket: 1, createdAt: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ featuredSection: 1, displayOrder: 1 });

/**
 * Compute total stock from the appropriate source (priority: matrix > colorStock > sizeStock > manual).
 * This hook runs on .save() — PATCH route manually mirrors this logic.
 */
productSchema.pre('save', function syncStock() {
  const matrixValues = this.variantMatrix instanceof Map
    ? [...this.variantMatrix.values()]
    : Object.values(this.variantMatrix ?? {});

  // Mode 1: color × size matrix — highest priority
  if (matrixValues.length > 0) {
    const total = matrixValues.reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
    this.quantity = total;
    this.stock    = total;
    // Derive colorStock and sizeStock from the matrix (sum per axis)
    const colorSums = {};
    const sizeSums  = {};
    const matrix    = this.variantMatrix instanceof Map ? this.variantMatrix : new Map(Object.entries(this.variantMatrix ?? {}));
    for (const [key, qty] of matrix) {
      const [color, size] = key.split('|');
      if (color) colorSums[color] = (colorSums[color] || 0) + Math.max(0, parseInt(qty) || 0);
      if (size)  sizeSums[size]  = (sizeSums[size]  || 0) + Math.max(0, parseInt(qty) || 0);
    }
    this.colorStock = new Map(Object.entries(colorSums));
    this.sizeStock  = new Map(Object.entries(sizeSums));
    return;
  }

  // Mode 2: colorStock only
  const colorValues = this.colorStock instanceof Map
    ? [...this.colorStock.values()]
    : Object.values(this.colorStock ?? {});
  if (colorValues.length > 0) {
    const total = colorValues.reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
    this.quantity = total;
    this.stock    = total;
    return;
  }

  // Mode 3: sizeStock only
  const sizeValues = this.sizeStock instanceof Map
    ? [...this.sizeStock.values()]
    : Object.values(this.sizeStock ?? {});
  if (sizeValues.length > 0) {
    const total = sizeValues.reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
    this.quantity = total;
    this.stock    = total;
    return;
  }

  // Mode 4: manual quantity
  if (this.isModified('quantity')) {
    this.stock = this.quantity;
  } else if (this.isModified('stock')) {
    this.quantity = this.stock;
  }
});

// ── Post-save: auto-sync Inventory ─────────────────────────────
productSchema.post('save', async function (doc) {
  try {
    const { syncInventory } = await import('../services/inventoryService.js');
    await syncInventory(doc, 'ADMIN_UPDATE', 'Product saved by admin');
  } catch (err) {
    console.error('[Inventory] post-save sync failed:', err.message);
  }
});

// ── Post-delete: remove from Inventory and Reviews ─────────────
productSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  try {
    const Inventory = mongoose.models.Inventory || mongoose.model('Inventory');
    await Inventory.deleteOne({ productId: doc.id });
    console.log(`[Inventory] Removed inventory entry for deleted product: ${doc.id}`);

    const Review = mongoose.models.Review || mongoose.model('Review');
    await Review.deleteMany({ productId: doc.id });
    console.log(`[Review] Removed all reviews for deleted product: ${doc.id}`);
  } catch (err) {
    console.error('[Product Post-delete] cleanup failed:', err.message);
  }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
