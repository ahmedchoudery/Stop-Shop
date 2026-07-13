import Reservation from '../models/Reservation.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

/**
 * Periodically processes expired reservations, releases stock, and deletes reservation documents.
 */
export async function releaseExpiredReservations() {
  const now = new Date();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Find all expired reservations
      const expired = await Reservation.find({ expiresAt: { $lt: now } }).session(session);
      if (expired.length === 0) return;

      console.log(`[Reservation Cron] Found ${expired.length} expired reservations to release.`);

      for (const res of expired) {
        // Parse variant key info from SKU (format: productId:color:size)
        const parts = res.sku.split(':');
        const productId = parts[0];
        const color = parts[1] || '';
        const size = parts[2] || '';

        const product = await Product.findOne({ id: productId }).session(session);
        if (product) {
          const qty = res.qty;
          const hasMatrix = product.variantMatrix instanceof Map
            ? product.variantMatrix.size > 0
            : Object.keys(product.variantMatrix ?? {}).length > 0;

          const sizeStockMap = product.sizeStock;
          const colorStockMap = product.colorStock;
          const hasSizeStock = sizeStockMap && (sizeStockMap instanceof Map ? sizeStockMap.size > 0 : Object.keys(sizeStockMap).length > 0);
          const hasColorStock = colorStockMap && (colorStockMap instanceof Map ? colorStockMap.size > 0 : Object.keys(colorStockMap).length > 0);

          const matrixKey = (hasMatrix && color && size) ? `variantMatrix.${color}|${size}` : null;
          const sizeKey   = (!matrixKey && size && hasSizeStock)  ? `sizeStock.${size}`  : null;
          const colorKey  = (!matrixKey && color && hasColorStock) ? `colorStock.${color}` : null;

          const stockUpdate = { $inc: { quantity: qty, stock: qty } };
          if (matrixKey) {
            Reflect.set(stockUpdate.$inc, matrixKey, qty);
            Reflect.set(stockUpdate.$inc, `colorStock.${color}`, qty);
            Reflect.set(stockUpdate.$inc, `sizeStock.${size}`, qty);
          }
          if (sizeKey)   Reflect.set(stockUpdate.$inc, sizeKey, qty);
          if (colorKey)  Reflect.set(stockUpdate.$inc, colorKey, qty);

          await Product.updateOne({ id: productId }, stockUpdate, { session });
          console.log(`[Reservation Cron] Released ${qty} units for product ${productId} variant ${color}|${size}`);
        }
        
        // Delete reservation
        await Reservation.deleteOne({ _id: res._id }, { session });
      }
    });
  } catch (err) {
    console.error(`[Reservation Cron] Release failed:`, err.message);
  } finally {
    await session.endSession();
  }
}

/**
 * Atomic decrement stock and insert/update reservation hold.
 */
export async function createReservation({ productId, color, size, qty, userId }, session = null) {
  const localSession = session || (await mongoose.startSession());
  let transactionResult = null;

  const executeReservation = async (s) => {
    const product = await Product.findOne({ id: productId }).session(s);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const hasMatrix = product.variantMatrix instanceof Map
      ? product.variantMatrix.size > 0
      : Object.keys(product.variantMatrix ?? {}).length > 0;

    const sizeStockMap = product.sizeStock;
    const colorStockMap = product.colorStock;
    const hasSizeStock = sizeStockMap && (sizeStockMap instanceof Map ? sizeStockMap.size > 0 : Object.keys(sizeStockMap).length > 0);
    const hasColorStock = colorStockMap && (colorStockMap instanceof Map ? colorStockMap.size > 0 : Object.keys(colorStockMap).length > 0);

    const matrixKey = (hasMatrix && color && size) ? `variantMatrix.${color}|${size}` : null;
    const sizeKey   = (!matrixKey && size && hasSizeStock)  ? `sizeStock.${size}`  : null;
    const colorKey  = (!matrixKey && color && hasColorStock) ? `colorStock.${color}` : null;

    // Check available stock of variant
    let available = product.quantity;
    if (hasMatrix || hasSizeStock || hasColorStock) {
      let sizeAvailable = Infinity;
      let colorAvailable = Infinity;

      if (hasSizeStock && size) {
        sizeAvailable = sizeStockMap instanceof Map ? (sizeStockMap.get(size) ?? 0) : (Reflect.get(sizeStockMap, size) ?? 0);
      }
      if (hasColorStock && color) {
        colorAvailable = colorStockMap instanceof Map ? (colorStockMap.get(color) ?? 0) : (Reflect.get(colorStockMap, color) ?? 0);
      }

      available = Math.min(
        hasSizeStock && size ? sizeAvailable : product.quantity,
        hasColorStock && color ? colorAvailable : product.quantity
      );
      if (matrixKey) {
        available = product.variantMatrix instanceof Map ? (product.variantMatrix.get(`${color}|${size}`) ?? 0) : (Reflect.get(product.variantMatrix, `${color}|${size}`) ?? 0);
      }
    }

    if (available > 10) {
      return { reserved: false };
    }

    if (available < qty) {
      throw new Error('OUT_OF_STOCK');
    }

    // Atomic stock decrement
    const stockUpdate = { $inc: { quantity: -qty, stock: -qty } };
    const availabilityCheck = { id: productId, stock: { $gte: qty } };

    if (matrixKey) {
      Reflect.set(stockUpdate.$inc, matrixKey, -qty);
      Reflect.set(stockUpdate.$inc, `colorStock.${color}`, -qty);
      Reflect.set(stockUpdate.$inc, `sizeStock.${size}`, -qty);
      Reflect.set(availabilityCheck, matrixKey, { $gte: qty });
      Reflect.set(availabilityCheck, `colorStock.${color}`, { $gte: qty });
      Reflect.set(availabilityCheck, `sizeStock.${size}`, { $gte: qty });
    } else {
      if (sizeKey) {
        Reflect.set(stockUpdate.$inc, sizeKey, -qty);
        Reflect.set(availabilityCheck, sizeKey, { $gte: qty });
      }
      if (colorKey) {
        Reflect.set(stockUpdate.$inc, colorKey, -qty);
        Reflect.set(availabilityCheck, colorKey, { $gte: qty });
      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      availabilityCheck,
      stockUpdate,
      { new: true, session: s }
    );

    if (!updatedProduct) {
      throw new Error('OUT_OF_STOCK');
    }

    // Save/update reservation Hold
    const sku = `${productId}:${color}:${size}`;
    const variantId = `${productId}-${color}-${size}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const reservation = await Reservation.findOneAndUpdate(
      { productId, variantId, userId },
      {
        $setOnInsert: { sku },
        $inc: { qty: qty },
        $set: { expiresAt }
      },
      { upsert: true, new: true, session: s }
    );

    return reservation;
  };

  if (session) {
    transactionResult = await executeReservation(session);
  } else {
    try {
      await localSession.withTransaction(async () => {
        transactionResult = await executeReservation(localSession);
      });
    } finally {
      await localSession.endSession();
    }
  }

  return transactionResult;
}

/**
 * Atomic increment stock (release reservation) when item is removed or quantity decremented in cart.
 */
export async function removeReservation({ productId, color, size, qty, userId }, session = null) {
  const localSession = session || (await mongoose.startSession());
  let transactionResult = null;

  const executeRemoval = async (s) => {
    const variantId = `${productId}-${color}-${size}`;
    const reservation = await Reservation.findOne({ productId, variantId, userId }).session(s);
    if (!reservation) return null;

    const releaseQty = Math.min(qty, reservation.qty);
    if (releaseQty <= 0) return null;

    // Restore stock
    const product = await Product.findOne({ id: productId }).session(s);
    if (product) {
      const hasMatrix = product.variantMatrix instanceof Map
        ? product.variantMatrix.size > 0
        : Object.keys(product.variantMatrix ?? {}).length > 0;

      const sizeStockMap = product.sizeStock;
      const colorStockMap = product.colorStock;
      const hasSizeStock = sizeStockMap && (sizeStockMap instanceof Map ? sizeStockMap.size > 0 : Object.keys(sizeStockMap).length > 0);
      const hasColorStock = colorStockMap && (colorStockMap instanceof Map ? colorStockMap.size > 0 : Object.keys(colorStockMap).length > 0);

      const matrixKey = (hasMatrix && color && size) ? `variantMatrix.${color}|${size}` : null;
      const sizeKey   = (!matrixKey && size && hasSizeStock)  ? `sizeStock.${size}`  : null;
      const colorKey  = (!matrixKey && color && hasColorStock) ? `colorStock.${color}` : null;

      const stockUpdate = { $inc: { quantity: releaseQty, stock: releaseQty } };
      if (matrixKey) {
        Reflect.set(stockUpdate.$inc, matrixKey, releaseQty);
        Reflect.set(stockUpdate.$inc, `colorStock.${color}`, releaseQty);
        Reflect.set(stockUpdate.$inc, `sizeStock.${size}`, releaseQty);
      }
      if (sizeKey)   Reflect.set(stockUpdate.$inc, sizeKey, releaseQty);
      if (colorKey)  Reflect.set(stockUpdate.$inc, colorKey, releaseQty);

      await Product.updateOne({ id: productId }, stockUpdate, { session: s });
    }

    if (reservation.qty <= releaseQty) {
      await Reservation.deleteOne({ _id: reservation._id }, { session: s });
      return { deleted: true };
    } else {
      reservation.qty -= releaseQty;
      await reservation.save({ session: s });
      return reservation;
    }
  };

  if (session) {
    transactionResult = await executeRemoval(session);
  } else {
    try {
      await localSession.withTransaction(async () => {
        transactionResult = await executeRemoval(localSession);
      });
    } finally {
      await localSession.endSession();
    }
  }

  return transactionResult;
}
