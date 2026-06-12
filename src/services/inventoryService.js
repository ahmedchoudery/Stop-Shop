import Inventory from '../models/Inventory.js';

const LOW_STOCK_THRESHOLD = 3;

/**
 * Upsert an Inventory document from a Product document.
 * Calculates status, appends movement log entry.
 *
 * @param {Object} product    - Mongoose Product document or plain object
 * @param {string} moveType   - Movement type: RESTOCK | SALE | ADMIN_UPDATE | INITIAL
 * @param {string} [note]     - Human-readable note for this movement
 * @param {string} [orderId]  - Order ID if triggered by a sale
 */
export const syncInventory = async (product, moveType = 'ADMIN_UPDATE', note = '', orderId = null) => {
  try {
    const totalStock = product.quantity ?? 0;

    // Determine status
    const status = totalStock === 0
      ? 'Out of Stock'
      : totalStock < LOW_STOCK_THRESHOLD
        ? 'Low Stock'
        : 'In Stock';

    // Resolve sizeStock to a plain object (handles both Map and plain objects)
    const sizeStockPlain =
      product.sizeStock instanceof Map
        ? Object.fromEntries(product.sizeStock)
        : (product.sizeStock ?? {});

    // Fetch previous state for delta calculation
    const existing = await Inventory.findOne({ productId: product.id }).lean();
    const previousStock = existing?.totalStock ?? 0;
    const quantityDelta = totalStock - previousStock;

    // Build movement entry
    const movement = {
      type:          moveType,
      quantityDelta,
      previousStock,
      newStock:      totalStock,
      note:          note || `${moveType} — stock changed by ${quantityDelta > 0 ? '+' : ''}${quantityDelta}`,
      triggeredBy:   moveType === 'SALE' ? 'customer' : 'admin',
      orderId:       orderId ?? null,
      timestamp:     new Date(),
    };

    // Timestamp fields for last event
    const timeFields = {};
    if (moveType === 'RESTOCK' || (moveType === 'ADMIN_UPDATE' && quantityDelta > 0)) {
      timeFields.lastRestocked = new Date();
    }
    if (moveType === 'SALE') {
      timeFields.lastSold = new Date();
    }
    if (['ADMIN_UPDATE', 'RESTOCK'].includes(moveType)) {
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
          status,
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
