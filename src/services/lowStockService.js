import mongoose from 'mongoose';
import LowStockAlert from '../models/LowStockAlert.js';
import EmailOutbox from '../models/EmailOutbox.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';

/**
 * Gets the 7-day sales velocity for a variant.
 */
export async function getSalesVelocity(sku, variantId, session = null) {
  try {
    let color = '';
    let size = '';

    if (variantId && variantId !== 'default') {
      if (variantId.includes('|')) {
        const lastPipeIndex = variantId.lastIndexOf('|');
        color = variantId.substring(0, lastPipeIndex).trim();
        size = variantId.substring(lastPipeIndex + 1).trim();
      } else {
        // If single variant, we will match either color or size in the order items
        // We'll query matching orders for either selectedColor or selectedSize
        color = variantId;
        size = variantId;
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const matchQuery = {
      createdAt: { $gte: sevenDaysAgo },
      status: { $nin: ['Cancelled', 'Failed'] },
    };

    const pipeline = [
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $match: {
          'items.id': sku,
          ...(variantId && variantId !== 'default'
            ? variantId.includes('|')
              ? { 'items.selectedColor': color, 'items.selectedSize': size }
              : {
                  $or: [
                    { 'items.selectedColor': color },
                    { 'items.selectedSize': size },
                  ],
                }
            : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$items.quantity' },
        },
      },
    ];

    const aggregation = session
      ? await Order.aggregate(pipeline).session(session)
      : await Order.aggregate(pipeline);

    return aggregation[0]?.totalSold || 0;
  } catch (err) {
    console.error(`[LowStockService] Failed to calculate sales velocity: ${err.message}`);
    return 0;
  }
}

/**
 * Resolves stock information for a specific color/size variant.
 */
export function getVariantStock(product, color, size) {
  const hasMatrix = product.variantMatrix && (
    product.variantMatrix instanceof Map
      ? product.variantMatrix.size > 0
      : Object.keys(product.variantMatrix).length > 0
  );
  const hasSizeStock = product.sizeStock && (
    product.sizeStock instanceof Map
      ? product.sizeStock.size > 0
      : Object.keys(product.sizeStock).length > 0
  );
  const hasColorStock = product.colorStock && (
    product.colorStock instanceof Map
      ? product.colorStock.size > 0
      : Object.keys(product.colorStock).length > 0
  );

  if (hasMatrix && color && size) {
    const key = `${color}|${size}`;
    const val = product.variantMatrix instanceof Map
      ? product.variantMatrix.get(key)
      : product.variantMatrix[key];
    return { variantId: key, currentStock: val ?? 0 };
  }
  if (hasSizeStock && size && !color) {
    const val = product.sizeStock instanceof Map
      ? product.sizeStock.get(size)
      : product.sizeStock[size];
    return { variantId: size, currentStock: val ?? 0 };
  }
  if (hasColorStock && color && !size) {
    const val = product.colorStock instanceof Map
      ? product.colorStock.get(color)
      : product.colorStock[color];
    return { variantId: color, currentStock: val ?? 0 };
  }
  return { variantId: 'default', currentStock: product.quantity ?? 0 };
}

/**
 * Triggers low-stock checking and alert creation.
 */
export async function checkLowStockAlert(product, size = '', color = '', session = null) {
  try {
    const { variantId, currentStock } = getVariantStock(product, color, size);

    // 1. Resolve configurable low-stock threshold
    let threshold = product.lowStockThreshold;
    if (threshold === undefined || threshold === null) {
      const settings = session
        ? await Settings.findOne({}).session(session).lean()
        : await Settings.findOne({}).lean();
      threshold = settings?.lowStockThreshold ?? 5;
    }

    // If stock is not below threshold, do nothing
    if (currentStock >= threshold) {
      return;
    }

    // 2. Check if a snooze is active on this variant
    const now = new Date();
    const activeSnooze = session
      ? await LowStockAlert.findOne({ sku: product.id, variantId, snoozedUntil: { $gt: now } }).session(session)
      : await LowStockAlert.findOne({ sku: product.id, variantId, snoozedUntil: { $gt: now } });

    if (activeSnooze) {
      console.info(`[LowStockService] Alert for ${product.id} variant "${variantId}" is snoozed until ${activeSnooze.snoozedUntil}. Skipping alert.`);
      return;
    }

    // 3. Upsert low stock alert for today
    const todayStr = new Date().toISOString().split('T')[0];
    const query = { sku: product.id, variantId, date: todayStr };
    const update = { $setOnInsert: { sku: product.id, variantId, date: todayStr, status: 'active' } };
    const options = { upsert: true, new: true, rawResult: true };
    if (session) {
      options.session = session;
    }

    const upsertRes = session
      ? await LowStockAlert.findOneAndUpdate(query, update, options)
      : await LowStockAlert.findOneAndUpdate(query, update, options);

    const isNew = !upsertRes.lastErrorObject?.updatedExisting;

    if (isNew) {
      console.info(`[LowStockService] New low stock alert registered for product ${product.id} variant "${variantId}". Enqueuing email outbox.`);
      
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@stopandshop.pk';
      const salesVelocity = await getSalesVelocity(product.id, variantId, session);

      const emailData = {
        idempotencyKey: `low-stock:${product.id}:${variantId}:${todayStr}`,
        template: 'low-stock-alert-admin',
        to: adminEmail,
        data: {
          productId: product.id,
          productName: product.name,
          productImage: product.image || '',
          variantId,
          currentStock,
          salesVelocity,
          threshold,
          date: todayStr,
        },
        status: 'pending',
        attempts: 0,
        nextAttemptAt: new Date(),
      };

      if (session) {
        await EmailOutbox.create([emailData], { session });
      } else {
        await EmailOutbox.create(emailData);
      }
    }
  } catch (err) {
    console.error(`[LowStockService] Error checking low stock alert: ${err.message}`);
  }
}
