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
          sizeAvailable = sizeStockMap instanceof Map ? (sizeStockMap.get(size) ?? 0) : (sizeStockMap[size] ?? 0);
        }
        if (hasColorStock && color) {
          colorAvailable = colorStockMap instanceof Map ? (colorStockMap.get(color) ?? 0) : (colorStockMap[color] ?? 0);
        }

        available = Math.min(
          hasSizeStock && size ? sizeAvailable : product.quantity,
          hasColorStock && color ? colorAvailable : product.quantity
        );
      }

      if (available < qty) {
        return NextResponse.json({
          error: `Not enough stock for ${product.name}${size ? ` (size ${size})` : ''}${color ? ` (color ${color})` : ''}. Available: ${available}`
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
      const color = (item.selectedColor ?? '').trim();

      // Determine which stock mode this product uses
      const dbProduct = productMap.get(item.id);
      const hasMatrix = dbProduct && dbProduct.variantMatrix instanceof Map
        ? dbProduct.variantMatrix.size > 0
        : Object.keys(dbProduct?.variantMatrix ?? {}).length > 0;

      const matrixKey = (hasMatrix && color && size) ? `variantMatrix.${color}|${size}` : null;
      const sizeKey   = (!matrixKey && size)  ? `sizeStock.${size}`  : null;
      const colorKey  = (!matrixKey && color) ? `colorStock.${color}` : null;

      const stockUpdate = { $inc: { quantity: -qty, stock: -qty } };
      if (matrixKey) {
        stockUpdate.$inc[matrixKey] = -qty;
        stockUpdate.$inc[`colorStock.${color}`] = -qty;
        stockUpdate.$inc[`sizeStock.${size}`] = -qty;
      }
      if (sizeKey)   stockUpdate.$inc[sizeKey]   = -qty;
      if (colorKey)  stockUpdate.$inc[colorKey]  = -qty;

      // Build availability check — use the correct stock map
      const availabilityCheck = {
        id: item.id,
        stock: { $gte: qty },
      };
      if (matrixKey) {
        availabilityCheck[matrixKey] = { $gte: qty };
        availabilityCheck[`colorStock.${color}`] = { $gte: qty };
        availabilityCheck[`sizeStock.${size}`] = { $gte: qty };
      }
      else if (sizeKey)  availabilityCheck[sizeKey]  = { $gte: qty };
      else if (colorKey) availabilityCheck[colorKey] = { $gte: qty };

      const updatedProduct = await Product.findOneAndUpdate(
        availabilityCheck,
        stockUpdate,
        { new: true }
      );

      if (!updatedProduct) {
        const name = dbProduct ? dbProduct.name : item.id;
        stockError = `Not enough stock for ${name}${size ? ` (size ${size})` : ''}${color ? ` (color ${color})` : ''}. Please adjust your quantity and try again.`;
        break;
      }

      completedDecrements.push({ item, qty, matrixKey, sizeKey, colorKey });

      await syncInventory(
        updatedProduct,
        'SALE',
        `Sold ${qty}x ${updatedProduct.name}${size ? ` (${size})` : ''}${color ? ` (${color})` : ''} via order ${orderID}`,
        orderID
      );
    }

    // Handle rollback function
    const rollbackStock = async () => {
      for (const dec of completedDecrements) {
        const rollbackUpdate = { $inc: { quantity: dec.qty, stock: dec.qty } };
        if (dec.matrixKey) {
          rollbackUpdate.$inc[dec.matrixKey] = dec.qty;
          const color = (dec.item.selectedColor ?? '').trim();
          const size = (dec.item.selectedSize ?? '').trim();
          if (color) rollbackUpdate.$inc[`colorStock.${color}`] = dec.qty;
          if (size) rollbackUpdate.$inc[`sizeStock.${size}`] = dec.qty;
        }
        if (dec.sizeKey)   rollbackUpdate.$inc[dec.sizeKey]   = dec.qty;
        if (dec.colorKey)  rollbackUpdate.$inc[dec.colorKey]  = dec.qty;

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

    let orderDoc;
    try {
      orderDoc = await Order.create({
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
    } catch (dbError) {
      console.error(`[Checkout] Order.create failed for ${orderID}:`, dbError.message);
      await rollbackStock();
      throw dbError;
    }

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
