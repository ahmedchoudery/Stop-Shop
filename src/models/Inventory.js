import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'RESTOCK', 'SALE', 'ADMIN_UPDATE', 'ADMIN_DELETE', 'INITIAL',
      'POS_SALE', 'MANUAL_ADJUST', 'SUPPLIER_RECEIVE', 'RETURN_RESTOCK', 'EXCHANGE_OUT'
    ],
    required: true,
  },
  quantityDelta:   { type: Number, required: true },  // +10 = restock, -2 = sale
  previousStock:   { type: Number, default: 0 },
  newStock:        { type: Number, default: 0 },
  note:            { type: String, default: '' },
  triggeredBy:     { type: String, default: 'system' }, // 'admin' | 'customer' | 'system' | 'pos'
  orderId:         { type: String, default: null },
  adjustmentReason:{ type: String, default: '' },        // Reason for manual adjustments
  supplierName:    { type: String, default: '' },        // Supplier info for receiving
  invoiceRef:      { type: String, default: '' },        // Supplier invoice reference
  timestamp:       { type: Date, default: Date.now },
}, { _id: false });

const inventorySchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────────
  productId:     { type: String, required: true, unique: true, index: true },
  sku:           { type: String, required: true, index: true },

  // ── Product snapshot (mirrored from products collection) ──────
  name:          { type: String, required: true, trim: true },
  category:      { type: String, required: true, trim: true },    // = bucket
  subCategory:   { type: String, required: true, trim: true },
  price:         { type: Number, required: true, min: 0 },
  image:         { type: String, default: '' },
  rating:        { type: Number, default: 5 },
  colorVariants: [{ type: String }],                              // = colors array
  sizes:         [{ type: String }],

  // ── Stock levels ──────────────────────────────────────────────
  discount:            { type: Number, default: 0, min: 0, max: 100 },
  totalStock:          { type: Number, default: 0, min: 0 },     // aggregate across all sizes
  sizeStock:           { type: Map, of: Number, default: {} },   // per-size breakdown
  colorStock:          { type: Map, of: Number, default: {} },   // per-color breakdown
  lowStockThreshold:   { type: Number, default: 5 },
  sectionName:         { type: String, default: 'Collection' },
  description:         { type: String, default: '' },
  careInstructions:    { type: String, default: '' },

  // ── Status (computed from totalStock) ─────────────────────────
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock',
    index: true,
  },

  // ── Timestamps of last events ─────────────────────────────────
  lastRestocked:   { type: Date, default: null },
  lastSold:        { type: Date, default: null },
  lastAdminEdit:   { type: Date, default: null },

  // ── Movement history (rolling last 100 events) ────────────────
  movements: {
    type: [inventoryMovementSchema],
    default: [],
  },

}, { timestamps: true, versionKey: false });

inventorySchema.index({ category: 1, status: 1 });
inventorySchema.index({ totalStock: 1 });
inventorySchema.index({ category: 1, totalStock: 1 });
inventorySchema.index({ updatedAt: -1 });

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

export default Inventory;
