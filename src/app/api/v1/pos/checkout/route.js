import { withRoute, ApiError, OutOfStockError } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Counter from '@/models/Counter';
import { syncInventory } from '@/services/inventoryService';
import { checkAndAlertLowStock } from '@/services/emailService';
import { logAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkLowStockAlert } from '@/services/lowStockService';

const safeGet = (obj, key) => {
  if (!obj || typeof obj !== 'object') return 0;
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return 0;
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc ? (desc.value ?? 0) : 0;
};

export const POST = withRoute({
  requiredRole: 'staff',
  schema: {
    body: z.object({
      items: z.array(z.object({
        id: z.string().min(1),
        name: z.string().optional(),
        price: z.number().optional(),
        quantity: z.number().int().positive(),
        selectedSize: z.string().optional(),
        selectedColor: z.string().optional(),
      })).min(1),
      paymentType: z.enum(['Cash', 'Card', 'Mobile']),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().trim().email().optional(),
      note: z.string().optional(),
    })
  },
  handler: async ({ req, body, user }) => {
    const {
      items,
      paymentType,
      customerName,
      customerPhone,
      customerEmail,
      note,
    } = body;

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const productIds = [...new Set(items.map(i => i.id))];

    const session = await mongoose.startSession();
    let responseData = null;

    try {
      await session.withTransaction(async () => {
        const dbProducts = await Product.find({ id: { $in: productIds } }).session(session);

        if (dbProducts.length !== productIds.length) {
          const missing = productIds.filter(id => !dbProducts.find(p => p.id === id));
          throw new Error(`Products not found: ${missing.join(', ')}`);
        }

        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        // Stock validation
        for (const item of items) {
          const product = productMap.get(item.id);
          if (!product) {
            throw new Error(`Product not found: ${item.id}`);
          }

          const qty = Math.max(1, parseInt(item.quantity) || 1);
          const size = (item.selectedSize ?? '').trim();
          const color = (item.selectedColor ?? '').trim();

          const hasMatrix = product.variantMatrix instanceof Map
            ? product.variantMatrix.size > 0
            : Object.keys(product.variantMatrix ?? {}).length > 0;

          let available = product.quantity;

          if (hasMatrix && color && size) {
            const matrixKey = `${color}|${size}`;
            available = product.variantMatrix instanceof Map
              ? (product.variantMatrix.get(matrixKey) ?? 0)
              : safeGet(product.variantMatrix, matrixKey);
          } else if (size && product.sizeStock) {
            available = product.sizeStock instanceof Map
              ? (product.sizeStock.get(size) ?? 0)
              : safeGet(product.sizeStock, size);
          } else if (color && product.colorStock) {
            available = product.colorStock instanceof Map
              ? (product.colorStock.get(color) ?? 0)
              : safeGet(product.colorStock, color);
          }

          if (available < qty) {
            throw new Error(`Insufficient stock for ${product.name}${size ? ` (${size})` : ''}${color ? ` (${color})` : ''}. Available: ${available}`);
          }
        }

        // Generate Order ID and Receipt Number using Counter sequence
        const year = new Date().getFullYear();
        const counter = await Counter.findOneAndUpdate(
          { _id: 'orderNumber' },
          { $inc: { seq: 1 } },
          { upsert: true, new: true, session }
        );
        const orderID = `STOP-${year}-${String(counter.seq).padStart(6, '0')}`;
        const receiptNumber = `RCP-${year}-${String(counter.seq).padStart(6, '0')}`;

        // Atomic stock decrements
        for (const item of items) {
          const qty = Math.max(1, parseInt(item.quantity) || 1);
          const size = (item.selectedSize ?? '').trim();
          const color = (item.selectedColor ?? '').trim();
          const dbProduct = productMap.get(item.id);

          const hasMatrix = dbProduct && dbProduct.variantMatrix instanceof Map
            ? dbProduct.variantMatrix.size > 0
            : Object.keys(dbProduct?.variantMatrix ?? {}).length > 0;

          const sizeStockMap = dbProduct?.sizeStock;
          const colorStockMap = dbProduct?.colorStock;
          const hasSizeStock = sizeStockMap && (sizeStockMap instanceof Map ? sizeStockMap.size > 0 : Object.keys(sizeStockMap).length > 0);
          const hasColorStock = colorStockMap && (colorStockMap instanceof Map ? colorStockMap.size > 0 : Object.keys(colorStockMap).length > 0);

          const matrixKey = (hasMatrix && color && size) ? `variantMatrix.${color}|${size}` : null;
          const sizeKey   = (!matrixKey && size && hasSizeStock)  ? `sizeStock.${size}`  : null;
          const colorKey  = (!matrixKey && color && hasColorStock) ? `colorStock.${color}` : null;

          const stockUpdate = { $inc: { quantity: -qty, stock: -qty } };
          if (matrixKey) {
            Reflect.set(stockUpdate.$inc, matrixKey, -qty);
            Reflect.set(stockUpdate.$inc, `colorStock.${color}`, -qty);
            Reflect.set(stockUpdate.$inc, `sizeStock.${size}`, -qty);
          }
          if (sizeKey)  Reflect.set(stockUpdate.$inc, sizeKey, -qty);
          if (colorKey) Reflect.set(stockUpdate.$inc, colorKey, -qty);

          const availabilityCheck = {
            id: item.id,
            stock: { $gte: qty },
          };
          if (matrixKey) {
            Reflect.set(availabilityCheck, matrixKey, { $gte: qty });
            Reflect.set(availabilityCheck, `colorStock.${color}`, { $gte: qty });
            Reflect.set(availabilityCheck, `sizeStock.${size}`, { $gte: qty });
          } else {
            if (sizeKey)  Reflect.set(availabilityCheck, sizeKey, { $gte: qty });
            if (colorKey) Reflect.set(availabilityCheck, colorKey, { $gte: qty });
          }

          const updatedProduct = await Product.findOneAndUpdate(
            availabilityCheck,
            stockUpdate,
            { new: true, session }
          );

          if (!updatedProduct) {
            const name = dbProduct ? dbProduct.name : item.id;
            throw new OutOfStockError(`Insufficient stock for ${name}${size ? ` (${size})` : ''}${color ? ` (${color})` : ''}. Item may have been sold.`);
          }

          await syncInventory(
            updatedProduct,
            'POS_SALE',
            `POS sale: ${qty}x ${updatedProduct.name}${size ? ` (${size})` : ''}${color ? ` (${color})` : ''} — ${orderID}`,
            orderID,
            {},
            session
          );

          await checkLowStockAlert(updatedProduct, size, color, session);
        }

        // Enrich items with product data
        const enrichedItems = items.map((item) => {
          const product = productMap.get(item.id);
          const discount = product?.discount ?? 0;
          const basePrice = product?.price ?? item.price ?? 0;
          const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

          return {
            id:            item.id,
            name:          product?.name || item.name || '',
            price:         finalPrice,
            quantity:      Math.max(1, parseInt(item.quantity) || 1),
            selectedSize:  (item.selectedSize ?? '').trim(),
            selectedColor: (item.selectedColor ?? '').trim(),
            category:      product?.bucket || '',
            subCategory:   product?.subCategory || '',
            image:         product?.image || '',
          };
        });

        const verifiedTotal = enrichedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        await Order.create([{
          orderID,
          customer: {
            name:  customerName || 'Walk-in Customer',
            email: customerEmail || 'pos@stopandshop.pk',
            phone: customerPhone || '0000000000',
          },
          items: enrichedItems,
          total: verifiedTotal,
          paymentMethod: paymentType === 'Cash' ? 'COD' : paymentType === 'Card' ? 'ATM Card' : 'Easypaisa',
          status: 'Delivered',
          salesChannel: 'POS',
          posDetails: {
            cashierName:   user?.name || user?.email || '',
            paymentType,
            receiptNumber,
          },
          paymentDetails: {
            transactionID: `POS-TXN-${Date.now().toString(36).toUpperCase()}`,
            status: 'Paid',
            gatewayLogs: [{
              action: 'POS_PAYMENT_RECEIVED',
              details: { paymentType, cashier: user?.email || '', note: note || '' },
            }],
          },
          ip: clientIp,
        }], { session });

        await logAudit('POS_SALE', {
          orderID,
          itemCount: enrichedItems.length,
          total: verifiedTotal,
          paymentType,
          cashier: user?.email || '',
        }, user?.email || '', req);

        checkAndAlertLowStock(enrichedItems);

        responseData = {
          message: 'POS sale completed',
          orderID,
          receiptNumber,
          total: verifiedTotal,
          items: enrichedItems,
          cashier: user?.name || user?.email,
          timestamp: new Date().toISOString(),
        };
      });
    } catch (orderErr) {
      console.error('[POS Checkout] Transaction failed:', orderErr.message);
      if (orderErr instanceof OutOfStockError) {
        throw orderErr;
      }
      throw new ApiError('VALIDATION', orderErr.message, 400);
    } finally {
      await session.endSession();
    }

    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    return NextResponse.json(responseData, { status: 201 });
  }
});
