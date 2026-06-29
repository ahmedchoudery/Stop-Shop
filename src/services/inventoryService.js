import Inventory from '../models/Inventory.js';

const LOW_STOCK_THRESHOLD = 3;

/**
 * Upsert an Inventory document from a Product document.
 * Calculates status, appends movement log entry.
 *
 * @param {Object} product    - Mongoose Product document or plain object
 * @param {string} moveType   - Movement type: RESTOCK | SALE | ADMIN_UPDATE | INITIAL | POS_SALE | MANUAL_ADJUST | SUPPLIER_RECEIVE | RETURN_RESTOCK | EXCHANGE_OUT
 * @param {string} [note]     - Human-readable note for this movement
 * @param {string} [orderId]  - Order ID if triggered by a sale
 * @param {Object} [meta]     - Optional metadata: { adjustmentReason, supplierName, invoiceRef }
 */
export const syncInventory = async (product, moveType = 'ADMIN_UPDATE', note = '', orderId = null, meta = {}) => {
  try {
    const totalStock = product.quantity ?? 0;

    // Determine status
    const status = totalStock === 0
      ? 'Out of Stock'
      : totalStock < LOW_STOCK_THRESHOLD
        ? 'Low Stock'
        : 'In Stock';

    // Resolve sizeStock & colorStock to plain objects (handles both Map and plain objects)
    const sizeStockPlain =
      product.sizeStock instanceof Map
        ? Object.fromEntries(product.sizeStock)
        : (product.sizeStock ?? {});

    const colorStockPlain =
      product.colorStock instanceof Map
        ? Object.fromEntries(product.colorStock)
        : (product.colorStock ?? {});

    // Fetch previous state for delta calculation
    const existing = await Inventory.findOne({ productId: product.id }).lean();
    const previousStock = existing?.totalStock ?? 0;
    const quantityDelta = totalStock - previousStock;

    // Determine who triggered this
    const triggeredByMap = {
      SALE: 'customer',
      POS_SALE: 'pos',
      MANUAL_ADJUST: 'admin',
      SUPPLIER_RECEIVE: 'admin',
      RETURN_RESTOCK: 'admin',
      EXCHANGE_OUT: 'admin',
    };

    // Build movement entry
    const movement = {
      type:             moveType,
      quantityDelta,
      previousStock,
      newStock:         totalStock,
      note:             note || `${moveType} — stock changed by ${quantityDelta > 0 ? '+' : ''}${quantityDelta}`,
      triggeredBy:      triggeredByMap[moveType] || 'admin',
      orderId:          orderId ?? null,
      adjustmentReason: meta.adjustmentReason || '',
      supplierName:     meta.supplierName || '',
      invoiceRef:       meta.invoiceRef || '',
      timestamp:        new Date(),
    };

    // Timestamp fields for last event
    const timeFields = {};
    if (['RESTOCK', 'SUPPLIER_RECEIVE'].includes(moveType) || (moveType === 'ADMIN_UPDATE' && quantityDelta > 0)) {
      timeFields.lastRestocked = new Date();
    }
    if (['SALE', 'POS_SALE'].includes(moveType)) {
      timeFields.lastSold = new Date();
    }
    if (['ADMIN_UPDATE', 'RESTOCK', 'MANUAL_ADJUST', 'SUPPLIER_RECEIVE', 'RETURN_RESTOCK', 'EXCHANGE_OUT'].includes(moveType)) {
      timeFields.lastAdminEdit = new Date();
    }

    // Upsert inventory document — keeps rolling 100-entry movement log
    await Inventory.findOneAndUpdate(
      { productId: product.id },
      {
        $set: {
          productId:    product.id,
          sku:          product.id,
          name:         product.name,
          category:     product.bucket || 'Tops',
          subCategory:  product.subCategory || 'Tshirt',
          price:        product.price,
          image:        product.image || '',
          rating:       product.rating ?? 5,
          colorVariants: product.colors ?? [],
          sizes:        product.sizes ?? [],
          discount:     product.discount ?? 0,
          totalStock,
          sizeStock:    sizeStockPlain,
          colorStock:   colorStockPlain,
          status,
          sectionName:  product.sectionName || 'Collection',
          description:  product.description || '',
          careInstructions: product.careInstructions || '',
          ...timeFields,
        },
        $push: {
          movements: {
            $each:  [movement],
            $slice: -100,           // Keep last 100 movements
            $position: 0,           // Newest first
          },
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[Inventory] Synced: ${product.id} | ${product.name} | Stock: ${previousStock} → ${totalStock} | ${status}`);
  } catch (err) {
    // Never let inventory sync crash the main operation
    console.error('[Inventory] Sync failed for product', product.id, ':', err.message);
  }
};

