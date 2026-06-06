import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Product from '../../../models/Product';
import Order from '../../../models/Order';
import Coupon from '../../../models/Coupon';
import { checkoutSchema } from '../../../schemas/validation';
import { syncInventory } from '../../../services/inventoryService';
import { sendEmail, checkAndAlertLowStock } from '../../../services/emailService';
import { cacheService, CACHE_KEYS } from '../../../services/cacheService';

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

    const { customer, items, total, paymentMethod } = validation.data;
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

      if (updatedProduct) {
        await syncInventory(
          updatedProduct,
          'SALE',
          `Sold ${qty}x ${updatedProduct.name}${size ? ` (${size})` : ''} via order ${orderID}`,
          orderID
        );
      }
    }

    const enrichedItems = items.map(item => {
      const product = productMap.get(item.id);
      return {
        id:            item.id,
        name:          product?.name || item.name || '',
        price:         product?.price ?? item.price ?? 0,
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
    const finalTotal = Math.max(0, verifiedTotal);

    await Order.create({
      orderID,
      customer,
      items: enrichedItems,
      total: finalTotal,
      paymentMethod,
      ip: clientIp
    });

    if (body.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: body.couponCode.trim().toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    sendEmail({
      from:    `"Stop & Shop" <${getEnv('EMAIL_USER', 'email_user')}>`,
      to:      customer.email,
      subject: `Order Confirmed — ${orderID}`,
      html:    `
        <h2>Thank you, ${customer.name}!</h2>
        <p>Your order <strong>${orderID}</strong> has been placed successfully.</p>
        <p><strong>Total:</strong> PKR ${finalTotal.toLocaleString()}</p>
        <p><strong>Payment:</strong> ${paymentMethod}</p>
        <p>Track your order: <a href="https://stop-shop-gamma.vercel.app/track?orderID=${orderID}">Click here</a></p>
        <p>Thank you for shopping with Stop & Shop.</p>
      `,
    });

    checkAndAlertLowStock(items);

    return NextResponse.json({ message: 'Order placed', orderID, verifiedTotal: finalTotal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
