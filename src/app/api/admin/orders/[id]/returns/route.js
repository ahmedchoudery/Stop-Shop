import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/db';
import Order from '../../../../../../models/Order';
import Product from '../../../../../../models/Product';
import { requireAdmin } from '../../../../../../lib/adminAuth';
import { syncInventory } from '../../../../../../services/inventoryService';
import { logAudit } from '../../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../../services/cacheService';

/**
 * POST /api/admin/orders/[id]/returns
 * Process a return or exchange for items in an existing order.
 * Body: {
 *   items: [{ itemId, quantity, reason, type: 'Return'|'Exchange', exchangeForId?, exchangeForSize?, exchangeForColor? }]
 * }
 */
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Find the order
    const order = await Order.findOne({ orderID: id });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const results = [];
    let totalRefund = 0;

    for (const returnItem of items) {
      const { itemId, quantity, reason, type, exchangeForId, exchangeForSize, exchangeForColor } = returnItem;

      if (!itemId || !quantity || !reason || !type) {
        return NextResponse.json({
          error: 'Each item needs: itemId, quantity, reason, type (Return or Exchange)'
        }, { status: 400 });
      }

      if (!['Return', 'Exchange'].includes(type)) {
        return NextResponse.json({ error: 'Type must be Return or Exchange' }, { status: 400 });
      }

      // Find the item in the order
      const orderItem = order.items.find(i => i.id === itemId);
      if (!orderItem) {
        return NextResponse.json({
          error: `Item ${itemId} not found in order ${id}`
        }, { status: 400 });
      }

      // Validate quantity
      const alreadyReturned = (order.returnedItems || [])
        .filter(r => r.itemId === itemId)
        .reduce((sum, r) => sum + r.quantity, 0);

      if (quantity > orderItem.quantity - alreadyReturned) {
        return NextResponse.json({
          error: `Cannot return ${quantity} of ${orderItem.name}. Max returnable: ${orderItem.quantity - alreadyReturned}`
        }, { status: 400 });
      }

      // Restock the returned product
      const returnedProduct = await Product.findOne({ id: itemId });
      if (returnedProduct) {
        const size = (orderItem.selectedSize ?? '').trim();
        const color = (orderItem.selectedColor ?? '').trim();

        const hasMatrix = returnedProduct.variantMatrix instanceof Map
          ? returnedProduct.variantMatrix.size > 0
          : Object.keys(returnedProduct.variantMatrix ?? {}).length > 0;

        const restockUpdate = { $inc: { quantity: quantity, stock: quantity } };

        if (hasMatrix && color && size) {
          restockUpdate.$inc[`variantMatrix.${color}|${size}`] = quantity;
          restockUpdate.$inc[`colorStock.${color}`] = quantity;
          restockUpdate.$inc[`sizeStock.${size}`] = quantity;
        } else if (size) {
          restockUpdate.$inc[`sizeStock.${size}`] = quantity;
        } else if (color) {
          restockUpdate.$inc[`colorStock.${color}`] = quantity;
        }

        const updatedReturnProduct = await Product.findOneAndUpdate(
          { id: itemId },
          restockUpdate,
          { new: true }
        );

        if (updatedReturnProduct) {
          await syncInventory(
            updatedReturnProduct,
            'RETURN_RESTOCK',
            `Returned ${quantity}x ${orderItem.name} from order ${id}: ${reason}`,
            id
          );
        }
      }

      // If exchange, decrement the new product's stock
      let exchangeProductName = '';
      if (type === 'Exchange' && exchangeForId) {
        const exchangeProduct = await Product.findOne({ id: exchangeForId });
        if (!exchangeProduct) {
          return NextResponse.json({
            error: `Exchange product ${exchangeForId} not found`
          }, { status: 400 });
        }

        exchangeProductName = exchangeProduct.name;
        const exSize = (exchangeForSize ?? '').trim();
        const exColor = (exchangeForColor ?? '').trim();

        const hasExMatrix = exchangeProduct.variantMatrix instanceof Map
          ? exchangeProduct.variantMatrix.size > 0
          : Object.keys(exchangeProduct.variantMatrix ?? {}).length > 0;

        const exchangeUpdate = { $inc: { quantity: -quantity, stock: -quantity } };
        const availCheck = { id: exchangeForId, stock: { $gte: quantity } };

        if (hasExMatrix && exColor && exSize) {
          const mk = `variantMatrix.${exColor}|${exSize}`;
          exchangeUpdate.$inc[mk] = -quantity;
          exchangeUpdate.$inc[`colorStock.${exColor}`] = -quantity;
          exchangeUpdate.$inc[`sizeStock.${exSize}`] = -quantity;
          availCheck[mk] = { $gte: quantity };
        } else if (exSize) {
          exchangeUpdate.$inc[`sizeStock.${exSize}`] = -quantity;
          availCheck[`sizeStock.${exSize}`] = { $gte: quantity };
        } else if (exColor) {
          exchangeUpdate.$inc[`colorStock.${exColor}`] = -quantity;
          availCheck[`colorStock.${exColor}`] = { $gte: quantity };
        }

        const updatedExchangeProduct = await Product.findOneAndUpdate(
          availCheck,
          exchangeUpdate,
          { new: true }
        );

        if (!updatedExchangeProduct) {
          return NextResponse.json({
            error: `Insufficient stock for exchange product: ${exchangeProduct.name}`
          }, { status: 400 });
        }

        await syncInventory(
          updatedExchangeProduct,
          'EXCHANGE_OUT',
          `Exchanged ${quantity}x for order ${id}: ${reason}`,
          id
        );
      }

      // Calculate refund for returns
      const refundAmount = type === 'Return' ? orderItem.price * quantity : 0;
      totalRefund += refundAmount;

      // Record the return/exchange in the order
      order.returnedItems = order.returnedItems || [];
      order.returnedItems.push({
        itemId,
        itemName: orderItem.name,
        quantity,
        reason,
        type,
        exchangeForId: exchangeForId || '',
        exchangeForName: exchangeProductName,
        refundAmount,
        processedBy: adminPayload.email,
        processedAt: new Date(),
      });

      results.push({
        itemId,
        itemName: orderItem.name,
        type,
        quantity,
        refundAmount,
        exchangeForName: exchangeProductName || undefined,
      });
    }

    // Update order status
    const totalOrderedQty = order.items.reduce((s, i) => s + i.quantity, 0);
    const totalReturnedQty = (order.returnedItems || []).reduce((s, r) => s + r.quantity, 0);

    if (totalReturnedQty >= totalOrderedQty) {
      order.status = 'Returned';
    } else if (totalReturnedQty > 0) {
      order.status = 'Partially Returned';
    }

    if (totalRefund > 0) {
      order.total = Math.max(0, order.total - totalRefund);
    }

    await order.save();

    // Audit
    await logAudit('ORDER_RETURN_EXCHANGE', {
      orderID: id,
      items: results,
      totalRefund,
      newOrderStatus: order.status,
    }, adminPayload.email, req);

    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    return NextResponse.json({
      message: 'Return/exchange processed',
      orderID: id,
      results,
      totalRefund,
      newStatus: order.status,
      newTotal: order.total,
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('[Returns] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
