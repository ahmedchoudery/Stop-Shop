import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Product from '../../../../models/Product';
import Order from '../../../../models/Order';
import { requireAdmin } from '../../../../lib/adminAuth';
import { syncInventory } from '../../../../services/inventoryService';
import { checkAndAlertLowStock } from '../../../../services/emailService';
import { logAudit } from '../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../services/cacheService';

/**
 * POST /api/pos/checkout
 * Processes a POS (physical store) sale with atomic stock decrement.
 * Replicates the web checkout flow but optimized for in-store use.
 */
export async function POST(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      items,             // [{ id, name, price, quantity, selectedSize, selectedColor }]
      paymentType,       // 'Cash' | 'Card' | 'Mobile'
      customerName,      // optional walk-in customer name
      customerPhone,     // optional
      customerEmail,     // optional
      note,              // optional clerk note
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!paymentType || !['Cash', 'Card', 'Mobile'].includes(paymentType)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const productIds = [...new Set(items.map(i => i.id))];
    const dbProducts = await Product.find({ id: { $in: productIds } });

    if (dbProducts.length !== productIds.length) {
      const missing = productIds.filter(id => !dbProducts.find(p => p.id === id));
      return NextResponse.json({
        error: `Products not found: ${missing.join(', ')}`
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

      const hasMatrix = product.variantMatrix instanceof Map
        ? product.variantMatrix.size > 0
        : Object.keys(product.variantMatrix ?? {}).length > 0;

      let available = product.quantity;

      if (hasMatrix && color && size) {
        const matrixKey = `${color}|${size}`;
        available = product.variantMatrix instanceof Map
          ? (product.variantMatrix.get(matrixKey) ?? 0)
          : (product.variantMatrix?.[matrixKey] ?? 0);
      } else if (size && product.sizeStock) {
        available = product.sizeStock instanceof Map
          ? (product.sizeStock.get(size) ?? 0)
          : (product.sizeStock?.[size] ?? 0);
      } else if (color && product.colorStock) {
        available = product.colorStock instanceof Map
          ? (product.colorStock.get(color) ?? 0)
          : (product.colorStock?.[color] ?? 0);
      }

      if (available < qty) {
        return NextResponse.json({
          error: `Insufficient stock for ${product.name}${size ? ` (${size})` : ''}${color ? ` (${color})` : ''}. Available: ${available}`
        }, { status: 400 });
      }
    }

    // Generate order ID
    const orderID = `POS-${Date.now().toString(36).toUpperCase()}`;
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

    const completedDecrements = [];
    let stockError = null;

    // Atomic stock decrements (same strategy as web checkout)
    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const size = (item.selectedSize ?? '').trim();
      const color = (item.selectedColor ?? '').trim();
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
      if (sizeKey)  stockUpdate.$inc[sizeKey]  = -qty;
      if (colorKey) stockUpdate.$inc[colorKey] = -qty;

      // Availability guard — atomic check-and-decrement
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
        stockError = `Insufficient stock for ${name}${size ? ` (${size})` : ''}${color ? ` (${color})` : ''}. Item may have been sold.`;
        break;
      }

      completedDecrements.push({ item, qty, matrixKey, sizeKey, colorKey });

      // Sync inventory with POS_SALE movement type
      await syncInventory(
        updatedProduct,
        'POS_SALE',
        `POS sale: ${qty}x ${updatedProduct.name}${size ? ` (${size})` : ''}${color ? ` (${color})` : ''} — ${orderID}`,
        orderID
      );
    }

    // Rollback on failure
    if (stockError) {
      for (const dec of completedDecrements) {
        const rollbackUpdate = { $inc: { quantity: dec.qty, stock: dec.qty } };
        if (dec.matrixKey) {
          rollbackUpdate.$inc[dec.matrixKey] = dec.qty;
          const color = (dec.item.selectedColor ?? '').trim();
          const size = (dec.item.selectedSize ?? '').trim();
          if (color) rollbackUpdate.$inc[`colorStock.${color}`] = dec.qty;
          if (size)  rollbackUpdate.$inc[`sizeStock.${size}`] = dec.qty;
        }
        if (dec.sizeKey)  rollbackUpdate.$inc[dec.sizeKey]  = dec.qty;
        if (dec.colorKey) rollbackUpdate.$inc[dec.colorKey] = dec.qty;

        await Product.findOneAndUpdate({ id: dec.item.id }, rollbackUpdate);
      }
      return NextResponse.json({ error: stockError }, { status: 400 });
    }

    // Enrich items with product data
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
        category:      product?.bucket || '',
        subCategory:   product?.subCategory || '',
        image:         product?.image || '',
      };
    });

    const verifiedTotal = enrichedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order document
    const orderDoc = await Order.create({
      orderID,
      customer: {
        name:  customerName || 'Walk-in Customer',
        email: customerEmail || 'pos@stopandshop.pk',
        phone: customerPhone || '',
      },
      items: enrichedItems,
      total: verifiedTotal,
      paymentMethod: paymentType === 'Cash' ? 'COD' : paymentType === 'Card' ? 'ATM Card' : 'Easypaisa',
      status: 'Delivered',   // POS sales are instantly fulfilled
      salesChannel: 'POS',
      posDetails: {
        cashierName:   adminPayload.name || adminPayload.email || '',
        paymentType,
        receiptNumber,
      },
      paymentDetails: {
        transactionID: `POS-TXN-${Date.now().toString(36).toUpperCase()}`,
        status: 'Paid',
        gatewayLogs: [{
          action: 'POS_PAYMENT_RECEIVED',
          details: { paymentType, cashier: adminPayload.email, note: note || '' },
        }],
      },
      ip: clientIp,
    });

    // Audit log
    await logAudit('POS_SALE', {
      orderID,
      itemCount: enrichedItems.length,
      total: verifiedTotal,
      paymentType,
      cashier: adminPayload.email,
    }, adminPayload.email, req);

    // Invalidate caches
    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    // Check low stock alerts
    checkAndAlertLowStock(enrichedItems);

    return NextResponse.json({
      message: 'POS sale completed',
      orderID,
      receiptNumber,
      total: verifiedTotal,
      items: enrichedItems,
      cashier: adminPayload.name || adminPayload.email,
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('[POS Checkout] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
