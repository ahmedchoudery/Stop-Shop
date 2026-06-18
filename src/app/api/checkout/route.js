import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Product from '../../../models/Product';
import Order from '../../../models/Order';
import Coupon from '../../../models/Coupon';
import { checkoutSchema } from '../../../schemas/validation';
import { syncInventory } from '../../../services/inventoryService';
import { sendOrderConfirmationEmail, checkAndAlertLowStock, sendOrderFailedEmail, sendAdminNewOrderNotification } from '../../../services/emailService';
import { cacheService, CACHE_KEYS } from '../../../services/cacheService';
import paymentFactory from '../../../lib/payments/PaymentFactory';
import { calculateDiscount } from '../../../utils/pricing';

const getEnv = (...keys) => keys.map(k => process.env[k]).find(Boolean);

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { customer, items, total, paymentMethod, couponCode, paymentDetails } = validation.data;
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const productIds = [...new Set(items.map(i => i.id))];

    const dbProducts = await Product.find({ id: { $in: productIds } });
    if (dbProducts.length !== productIds.length) {
      const missing = productIds.filter(id => !dbProducts.find(p => p.id === id));
      return NextResponse.json({
        error: `Some products in your cart are no longer available: ${missing.join(', ')}`
      }, { status: 400 });
    }
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Stock validation
    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const size = (item.selectedSize ?? '').trim();
      
      let available = product.quantity;
      if (size && product.sizeStock) {
        available = product.sizeStock.get?.(size) ?? product.sizeStock[size] ?? 0;
      }

      if (available < qty) {
        return NextResponse.json({
          error: `Not enough stock for ${product.name}${size ? ` (size ${size})` : ''}. Available: ${available}`
        }, { status: 400 });
      }
    }

    const orderID = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const completedDecrements = [];
    let stockError = null;

    // Decrement stock + sync inventory per product
    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const size = (item.selectedSize ?? '').trim();
      const sizeKey = size ? `sizeStock.${size}` : null;

      const stockUpdate = sizeKey
        ? { $inc: { quantity: -qty, stock: -qty, [sizeKey]: -qty } }
        : { $inc: { quantity: -qty, stock: -qty } };

      const updatedProduct = await Product.findOneAndUpdate(
        {
          id: item.id,
          ...(sizeKey ? { [sizeKey]: { $gte: qty } } : { stock: { $gte: qty } })
        },
        stockUpdate,
        { new: true }
      );

      if (!updatedProduct) {
        const dbProduct = productMap.get(item.id);
        const name = dbProduct ? dbProduct.name : item.id;
        stockError = `Not enough stock for ${name}${size ? ` (size ${size})` : ''}. Please adjust your quantity and try again.`;
        break;
      }

      completedDecrements.push({ item, qty, sizeKey });

      await syncInventory(
        updatedProduct,
        'SALE',
        `Sold ${qty}x ${updatedProduct.name}${size ? ` (${size})` : ''} via order ${orderID}`,
        orderID
      );
    }

    // Handle rollback function
    const rollbackStock = async () => {
      for (const dec of completedDecrements) {
        const rollbackUpdate = dec.sizeKey
          ? { $inc: { quantity: dec.qty, stock: dec.qty, [dec.sizeKey]: dec.qty } }
          : { $inc: { quantity: dec.qty, stock: dec.qty } };

        await Product.findOneAndUpdate(
          { id: dec.item.id },
          rollbackUpdate
        );
      }
    };

    if (stockError) {
      await rollbackStock();
      return NextResponse.json({ error: stockError }, { status: 400 });
    }

    // Enrich items
    const enrichedItems = items.map(item => {
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
      }).lean();

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
      await rollbackStock();
      const failedOrderStub = {
        orderID,
        customer,
        total: finalTotal,
        paymentMethod,
      };
      sendOrderFailedEmail(failedOrderStub, authResult.error || 'Payment authorization failed').catch(err => {
        console.error('[CheckoutFailedEmail] Failed to notify:', err.message);
      });
      return NextResponse.json({ error: authResult.error || 'Payment authorization failed' }, { status: 400 });
    }

    // Determine initial order and payment statuses
    // For COD: Order is Pending, Payment is Pending
    // For manual online payments: Order is Pending, Payment is Pending
    // For direct online payments: Order is Paid, Payment is Paid
    let initialOrderStatus = 'Pending';
    if (paymentMethod !== 'COD') {
      if (authResult.status === 'Paid') {
        initialOrderStatus = 'Paid';
      }
    }

    const orderDoc = await Order.create({
      orderID,
      customer,
      items: enrichedItems,
      total: finalTotal,
      paymentMethod,
      status: initialOrderStatus,
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
    });

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(
        appliedCoupon._id,
        { $inc: { usedCount: 1 } }
      );
    }

    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    sendOrderConfirmationEmail(orderDoc);
    sendAdminNewOrderNotification(orderDoc).catch(err => {
      console.error('[AdminNewOrderNotification] Failed:', err.message);
    });

    checkAndAlertLowStock(enrichedItems);

    return NextResponse.json({ message: 'Order placed', orderID, verifiedTotal: finalTotal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
