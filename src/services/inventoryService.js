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
export const syncInventory = async (product, moveType = 'ADMIN_UPDATE', note = '', orderId = null, meta = {}, session = null) => {
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
      triggeredBy:      (moveType && Object.prototype.hasOwnProperty.call(triggeredByMap, moveType)) ? Reflect.get(triggeredByMap, moveType) : 'admin',
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
          featuredSection: product.featuredSection || 'collection',
          displayOrder:    product.displayOrder ?? 0,
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
      { upsert: true, new: true, ...(session && { session }) }
    );

    console.info(`[Inventory] Synced: ${product.id} | ${product.name} | Stock: ${previousStock} → ${totalStock} | ${status}`);

    // Trigger restock check if total stock has increased or it is a restock
    if (quantityDelta > 0 || moveType === 'RESTOCK') {
      processRestockNotifications(product).catch(err => {
        console.error('[Inventory] Restock notification trigger failed:', err.message);
      });
    }
  } catch (err) {
    // Never let inventory sync crash the main operation
    console.error('[Inventory] Sync failed for product', product.id, ':', err.message);
  }
};

/**
 * Check waitlist notifications for this product and queue emails for restocked variants.
 */
async function processRestockNotifications(product) {
  try {
    const ProductNotification = (await import('../models/ProductNotification.js')).default;
    const EmailOutbox = (await import('../models/EmailOutbox.js')).default;

    const pending = await ProductNotification.find({
      productId: product.id,
      notified: false
    });

    if (pending.length === 0) return;

    // Resolve Maps
    const sizeStockObj = product.sizeStock
      ? (product.sizeStock instanceof Map ? Object.fromEntries(product.sizeStock) : product.sizeStock)
      : null;
    const colorStockObj = product.colorStock
      ? (product.colorStock instanceof Map ? Object.fromEntries(product.colorStock) : product.colorStock)
      : null;
    const variantMatrixObj = product.variantMatrix
      ? (product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : product.variantMatrix)
      : null;

    const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;
    const hasSizes = sizeStockObj && Object.keys(sizeStockObj).length > 0;
    const hasColors = colorStockObj && Object.keys(colorStockObj).length > 0;

    for (const notif of pending) {
      let inStock = false;

      if (hasMatrix) {
        if (notif.selectedColor && notif.selectedSize) {
          const qty = variantMatrixObj[`${notif.selectedColor}|${notif.selectedSize}`] ?? 0;
          inStock = qty > 0;
        } else if (notif.selectedSize) {
          const qty = sizeStockObj?.[notif.selectedSize] ?? 0;
          inStock = qty > 0;
        } else if (notif.selectedColor) {
          const qty = colorStockObj?.[notif.selectedColor] ?? 0;
          inStock = qty > 0;
        } else {
          inStock = (product.quantity ?? 0) > 0;
        }
      } else if (hasSizes && notif.selectedSize) {
        const qty = sizeStockObj[notif.selectedSize] ?? 0;
        inStock = qty > 0;
      } else if (hasColors && notif.selectedColor) {
        const qty = colorStockObj[notif.selectedColor] ?? 0;
        inStock = qty > 0;
      } else {
        inStock = (product.quantity ?? 0) > 0;
      }

      if (inStock) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stop-shop-gamma.vercel.app';
        const ctaUrl = `${appUrl}/product/${product.id}`;

        await EmailOutbox.create({
          to: notif.email,
          template: 'restock-notification-customer',
          data: {
            customerName: notif.name || 'Valued Customer',
            productName: product.name,
            productImage: product.image,
            selectedSize: notif.selectedSize,
            selectedColor: notif.selectedColor,
            productPrice: `Rs. ${product.price.toLocaleString('en-PK')}`,
            ctaUrl,
          },
          status: 'pending',
          attempts: 0,
          idempotencyKey: `restock-${notif._id.toString()}`,
        });

        notif.notified = true;
        await notif.save();
        console.info(`[Restock Service] Auto-queued restock email for ${notif.email} - ${product.name}`);
      }
    }
  } catch (err) {
    console.error('[Restock Service] Error in processRestockNotifications:', err.message);
  }
}

