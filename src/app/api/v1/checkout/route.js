import { withRoute, ApiError } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Coupon from '@/models/Coupon';
import { withIdempotency } from '@/utils/idempotency.js';
import { checkoutSchema } from '@/schemas/validation';
import { syncInventory } from '@/services/inventoryService';
import {
  sendOrderConfirmationEmail,
  checkAndAlertLowStock,
  sendOrderFailedEmail,
  sendAdminNewOrderNotification,
  processOutbox
} from '@/services/emailService';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import paymentFactory from '@/lib/payments/PaymentFactory';
import { calculateDiscount } from '@/utils/pricing';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export const POST = withIdempotency(withRoute({
  requiredRole: 'public',
  schema: {
    body: checkoutSchema
  },
  handler: async ({ req, body }) => {
    const { customer, items, paymentMethod, couponCode, paymentDetails } = body;
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const productIds = [...new Set(items.map(i => i.id))];

    const session = await mongoose.startSession();
    let responseData = null;

    try {
      await session.withTransaction(async () => {
        const dbProducts = await Product.find({ id: { $in: productIds } }).session(session);
        if (dbProducts.length !== productIds.length) {
          const missing = productIds.filter(id => !dbProducts.find(p => p.id === id));
          throw new Error(`Some products in your cart are no longer available: ${missing.join(', ')}`);
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

          const sizeStockMap = product.sizeStock;
          const colorStockMap = product.colorStock;

          const hasSizeStock = sizeStockMap && (sizeStockMap instanceof Map ? sizeStockMap.size > 0 : Object.keys(sizeStockMap).length > 0);
          const hasColorStock = colorStockMap && (colorStockMap instanceof Map ? colorStockMap.size > 0 : Object.keys(colorStockMap).length > 0);

          let available = product.quantity;

          if (hasSizeStock || hasColorStock) {
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
          }

          if (available < qty) {
            throw new Error(`Not enough stock for ${product.name}${size ? ` (size ${size})` : ''}${color ? ` (color ${color})` : ''}. Available: ${available}`);
          }
        }

        const orderID = `ORD-${Date.now().toString(36).toUpperCase()}`;

        // Decrement stock + sync inventory per product
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
          if (sizeKey)   Reflect.set(stockUpdate.$inc, sizeKey, -qty);
          if (colorKey)  Reflect.set(stockUpdate.$inc, colorKey, -qty);

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
            throw new Error(`Not enough stock for ${name}${size ? ` (size ${size})` : ''}${color ? ` (color ${color})` : ''}. Please adjust your quantity and try again.`);
          }

          await syncInventory(
            updatedProduct,
            'SALE',
            `Sold ${qty}x ${updatedProduct.name}${size ? ` (${size})` : ''}${color ? ` (${color})` : ''} via order ${orderID}`,
            orderID,
            {},
            session
          );
        }

        // Enrich items
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
            category:      product?.bucket || item.category || '',
            subCategory:   product?.subCategory || item.subCategory || '',
            image:         product?.image || '',
          };
        });

        const verifiedTotal = enrichedItems.reduce((sum, item) => {
          return sum + item.price * item.quantity;
        }, 0);

        let discount = 0;
        let appliedCoupon = null;

        if (couponCode) {
          const coupon = await Coupon.findOne({
            code: couponCode.trim().toUpperCase(),
            isActive: true,
          }).session(session).lean();

          if (coupon) {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const isMaxed = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;

            if (!isExpired && !isMaxed) {
              const res = calculateDiscount(verifiedTotal, coupon);
              if (res.discount > 0) {
                appliedCoupon = coupon;
                discount = res.discount;
              }
            }
          }
        }

        const finalTotal = Math.max(0, verifiedTotal - discount);

        // Call Payment Gateway authorize method
        let authResult;
        try {
          const gateway = paymentFactory.get(paymentMethod);
          authResult = await gateway.authorize({ orderID, total: finalTotal }, paymentDetails);
        } catch (paymentGatewayErr) {
          authResult = { success: false, error: paymentGatewayErr.message || 'Payment provider resolution failed' };
        }

        if (!authResult.success) {
          const failedOrderStub = {
            orderID,
            customer,
            total: finalTotal,
            paymentMethod,
          };
          sendOrderFailedEmail(failedOrderStub, authResult.error || 'Payment authorization failed').catch(err => {
            console.error('[CheckoutFailedEmail] Failed to notify:', err.message);
          });
          throw new Error(authResult.error || 'Payment authorization failed');
        }

        let initialOrderStatus = 'Pending';
        if (paymentMethod !== 'COD') {
          if (authResult.status === 'Paid') {
            initialOrderStatus = 'Paid';
          }
        }

        const [orderDoc] = await Order.create([{
          orderID,
          customer,
          items: enrichedItems,
          total: finalTotal,
          paymentMethod,
          status: initialOrderStatus,
          salesChannel: 'Web',
          paymentDetails: {
            transactionID:  authResult.transactionID,
            status:         authResult.status || 'Pending',
            paymentAccount: authResult.account || '',
            cardBrand:      authResult.brand || '',
            gatewayLogs:    [
              {
                action: authResult.logs?.action || 'PAYMENT_INITIALIZED',
                details: authResult.logs?.details || {},
              }
            ]
          },
          ip: clientIp
        }], { session });

        if (appliedCoupon) {
          await Coupon.findByIdAndUpdate(
            appliedCoupon._id,
            { $inc: { usedCount: 1 } },
            { session }
          );
        }

        // Queue Confirmation and Admin Emails inside transaction session (Outbox Pattern)
        await sendOrderConfirmationEmail(orderDoc, session);
        await sendAdminNewOrderNotification(orderDoc, session);

        // Non-transactional tasks done outside, queued on success:
        checkAndAlertLowStock(enrichedItems);

        responseData = { message: 'Order placed', orderID, verifiedTotal: finalTotal };
      });
    } catch (dbError) {
      console.error(`[Checkout] Transaction failed:`, dbError.message);
      throw new ApiError('VALIDATION', dbError.message, 400);
    } finally {
      await session.endSession();
    }

    // Invalidate caches
    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    // Process email outbox in the background
    processOutbox().catch(err => console.error('[BackgroundOutbox] Error processing email outbox:', err.message));

    return NextResponse.json(responseData, { status: 201 });
  }
}));
