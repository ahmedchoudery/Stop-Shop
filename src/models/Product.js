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
  bucket:        { type: String, default: 'Tops', trim: true },      // category
  subCategory:   { type: String, default: 'Tshirt', trim: true },
  specs:         [{ type: String }],
  colors:        [{ type: String }],
  sizes:         [{ type: String }],
  sizeStock:     { type: Map, of: Number, default: {} },  // { S: 10, M: 5, L: 3 }
  lifestyleImage: { type: String, default: '' },
  variantImages: { type: Map, of: String, default: {} },  // { 'Red': 'url', 'Blue': 'url' }
  gallery:       [{ type: String }],
}, { timestamps: true, versionKey: false, autoIndex: true });

productSchema.index({ bucket: 1, createdAt: -1 });
productSchema.index({ createdAt: -1 });

// Keep quantity + stock always in sync
productSchema.pre('save', function syncStock() {
  const sizeValues = this.sizeStock instanceof Map
    ? [...this.sizeStock.values()]
    : Object.values(this.sizeStock ?? {});

  if (sizeValues.length > 0) {
    const total = sizeValues.reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
    this.quantity = total;
    this.stock = total;
    return;
  }

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

// ── Post-delete: remove from Inventory ─────────────────────────
productSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  try {
    const Inventory = mongoose.models.Inventory || mongoose.model('Inventory');
    await Inventory.deleteOne({ productId: doc.id });
    console.log(`[Inventory] Removed inventory entry for deleted product: ${doc.id}`);
  } catch (err) {
    console.error('[Inventory] post-delete cleanup failed:', err.message);
  }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
