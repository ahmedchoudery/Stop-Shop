import React from 'react';
import { render } from '@react-email/render';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import ProductNotification from '../models/ProductNotification.js';
import { sendEmail } from './emailService.js';
import RestockNotificationCustomerEmail from '../emails/restock-notification-customer.tsx';

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

    // Trigger restock check whenever stock is available (wait 1.5s for transaction commit)
    if ((product.quantity ?? totalStock ?? 0) > 0) {
      setTimeout(() => {
        processRestockNotifications(product).catch(err => {
          console.error('[Inventory] Restock notification trigger failed:', err.message);
        });
      }, 1500);
    }
  } catch (err) {
    // Never let inventory sync crash the main operation
    console.error('[Inventory] Sync failed for product', product.id, ':', err.message);
  }
};

/**
 * Robust helper to check if a specific size/color variant is currently in stock.
 */
export function checkVariantInStock(product, selectedSize = '', selectedColor = '') {
  const extractMap = (val) => {
    if (!val) return {};
    if (typeof val.toObject === 'function') return val.toObject();
    if (val instanceof Map) return Object.fromEntries(val);
    if (typeof val === 'object') return val;
    return {};
  };

  const sizeStockObj = extractMap(product.sizeStock);
  const colorStockObj = extractMap(product.colorStock);
  const variantMatrixObj = extractMap(product.variantMatrix);

  const hasMatrix = Object.keys(variantMatrixObj).length > 0;
  const hasSizes = Object.keys(sizeStockObj).length > 0;
  const hasColors = Object.keys(colorStockObj).length > 0;

  const selSize = (selectedSize || '').trim();
  const selColor = (selectedColor || '').trim();

  if (hasMatrix) {
    if (selColor && selSize) {
      // 1. Direct exact key lookup
      const exactKey = `${selColor}|${selSize}`;
      let qty = Number(variantMatrixObj[exactKey] ?? 0);

      // 2. Fuzzy key match (handling hex/name split colors like "#609ba0|white" vs "white")
      if (qty === 0) {
        const matchingKey = Object.keys(variantMatrixObj).find(k => {
          const parts = k.split('|');
          const kSize = parts.pop();
          const kColor = parts.join('|');
          const matchC = kColor.toLowerCase() === selColor.toLowerCase() ||
                         kColor.toLowerCase().includes(selColor.toLowerCase()) ||
                         selColor.toLowerCase().includes(kColor.toLowerCase());
          const matchS = kSize.toLowerCase() === selSize.toLowerCase();
          return matchC && matchS;
        });
        if (matchingKey) {
          qty = Number(variantMatrixObj[matchingKey] ?? 0);
        }
      }
      return qty > 0;
    } else if (selSize) {
      const matrixStock = Object.keys(variantMatrixObj)
        .filter(k => k.split('|').pop().toLowerCase() === selSize.toLowerCase())
        .reduce((sum, k) => sum + (Number(variantMatrixObj[k]) || 0), 0);
      const directSizeStock = Number(sizeStockObj[selSize] ?? sizeStockObj[selSize.toUpperCase()] ?? 0);
      return (matrixStock > 0) || (directSizeStock > 0);
    } else if (selColor) {
      const matrixStock = Object.keys(variantMatrixObj)
        .filter(k => {
          const kColor = k.split('|').slice(0, -1).join('|');
          return kColor.toLowerCase() === selColor.toLowerCase() ||
                 kColor.toLowerCase().includes(selColor.toLowerCase()) ||
                 selColor.toLowerCase().includes(kColor.toLowerCase());
        })
        .reduce((sum, k) => sum + (Number(variantMatrixObj[k]) || 0), 0);
      const directColorStock = Number(colorStockObj[selColor] ?? 0);
      return (matrixStock > 0) || (directColorStock > 0);
    } else {
      return (Number(product.quantity) || 0) > 0;
    }
  } else {
    let sizeOk = true;
    let colorOk = true;

    if (selSize && hasSizes) {
      const matchedKey = Object.keys(sizeStockObj).find(k => k.toLowerCase() === selSize.toLowerCase());
      const qty = matchedKey ? Number(sizeStockObj[matchedKey]) : Number(sizeStockObj[selSize] ?? 0);
      sizeOk = qty > 0;
    }

    if (selColor && hasColors) {
      const matchedKey = Object.keys(colorStockObj).find(k =>
        k.toLowerCase() === selColor.toLowerCase() ||
        k.toLowerCase().includes(selColor.toLowerCase()) ||
        selColor.toLowerCase().includes(k.toLowerCase())
      );
      const qty = matchedKey ? Number(colorStockObj[matchedKey]) : Number(colorStockObj[selColor] ?? 0);
      colorOk = qty > 0;
    }

    if (selSize && !hasSizes && !hasColors) {
      sizeOk = (Number(product.quantity) || 0) > 0;
    }

    return sizeOk && colorOk && (Number(product.quantity) || 0) > 0;
  }
}

/**
 * Check waitlist notifications for this product and send restock emails immediately.
 */
async function processRestockNotifications(product) {
  try {
    const productSku = (product.get && typeof product.get === 'function') ? product.get('id') : product.id;
    const productIdStr = product._id?.toString() || product.id;

    // Fetch the latest product from DB to ensure we have the committed transaction data
    const dbProduct = await Product.findOne({
      $or: [{ id: productSku }, { _id: productIdStr }]
    });

    if (!dbProduct) {
      console.warn('[Restock Service] Product not found in DB:', productSku);
      return;
    }

    const validIds = Array.from(new Set([productSku, productIdStr, dbProduct.id, dbProduct._id?.toString()].filter(Boolean)));

    const pending = await ProductNotification.find({
      productId: { $in: validIds },
      notified: false
    });

    if (pending.length === 0) return;

    for (const notif of pending) {
      const inStock = checkVariantInStock(dbProduct, notif.selectedSize, notif.selectedColor);

      if (inStock) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stop-shop-gamma.vercel.app';
        const ctaUrl = `${appUrl}/product/${dbProduct.id}`;

        // Render JSX template to HTML string
        const emailHtml = render(
          React.createElement(RestockNotificationCustomerEmail, {
            customerName: notif.name || 'Valued Customer',
            productName: dbProduct.name,
            productImage: dbProduct.image,
            selectedSize: notif.selectedSize,
            selectedColor: notif.selectedColor,
            productPrice: `Rs. ${dbProduct.price.toLocaleString('en-PK')}`,
            ctaUrl,
          })
        );

        // Send email immediately
        const sent = await sendEmail({
          to: notif.email,
          subject: `🔥 BACK IN STOCK: ${dbProduct.name} is available!`,
          html: emailHtml,
        });

        if (sent) {
          notif.notified = true;
          await notif.save();
          console.info(`[Restock Service] Instantly dispatched restock email to ${notif.email} for ${dbProduct.name}`);
        } else {
          console.warn(`[Restock Service] Failed to send email to ${notif.email}. Keeping notification active for retry.`);
        }
      }
    }
  } catch (err) {
    console.error('[Restock Service] Error in processRestockNotifications:', err.message);
  }
}

