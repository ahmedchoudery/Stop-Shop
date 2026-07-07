import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/db';
import Order from '../../../../../../models/Order';
import Product from '../../../../../../models/Product';
import { requireAdmin } from '../../../../../../lib/adminAuth';
import { syncInventory } from '../../../../../../services/inventoryService';
import { withAudit } from '../../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../../services/cacheService';

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = await requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const order = await Order.findOne({ orderID: id });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const results = [];
    let totalRefund = 0;

    const auditResult = await withAudit(
      'ORDER_RETURN_EXCHANGE',
      id,
      req,
      { orderID: id, previousStatus: order.status },
      { newStatus: null, totalRefund: 0, items: results },
      async (session) => {
        for (const returnItem of items) {
          const { itemId, quantity, reason, type, exchangeForId, exchangeForSize, exchangeForColor } = returnItem;

          if (!itemId || !quantity || !reason || !type) {
            throw new Error('Each item needs: itemId, quantity, reason, type (Return or Exchange)');
          }

          if (!['Return', 'Exchange'].includes(type)) {
            throw new Error('Type must be Return or Exchange');
          }

          const orderItem = order.items.find(i => i.id === itemId);
          if (!orderItem) {
            throw new Error(`Item ${itemId} not found in order ${id}`);
          }

          const alreadyReturned = (order.returnedItems || [])
            .filter(r => r.itemId === itemId)
            .reduce((sum, r) => sum + r.quantity, 0);

          if (quantity > orderItem.quantity - alreadyReturned) {
            throw new Error(`Cannot return ${quantity} of ${orderItem.name}. Max returnable: ${orderItem.quantity - alreadyReturned}`);
          }

          // Restock the returned product
          const returnedProduct = await Product.findOne({ id: itemId }).session(session);
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
              { new: true, session }
            );

            if (updatedReturnProduct) {
              await syncInventory(
                updatedReturnProduct,
                'RETURN_RESTOCK',
                `Returned ${quantity}x ${orderItem.name} from order ${id}: ${reason}`,
                id,
                {},
                session
              );
            }
          }

          let exchangeProductName = '';
          if (type === 'Exchange' && exchangeForId) {
            const exchangeProduct = await Product.findOne({ id: exchangeForId }).session(session);
            if (!exchangeProduct) {
              throw new Error(`Exchange product ${exchangeForId} not found`);
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
              { new: true, session }
            );

            if (!updatedExchangeProduct) {
              throw new Error(`Insufficient stock for exchange product: ${exchangeProduct.name}`);
            }

            await syncInventory(
              updatedExchangeProduct,
              'EXCHANGE_OUT',
              `Exchanged ${quantity}x for order ${id}: ${reason}`,
              id,
              {},
              session
            );
          }

          const refundAmount = type === 'Return' ? orderItem.price * quantity : 0;
          totalRefund += refundAmount;

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

        await order.save({ session });
        return { totalRefund, results, status: order.status, total: order.total };
      }
    );

    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    return NextResponse.json({
      message: 'Return/exchange processed',
      orderID: id,
      results: auditResult.results,
      totalRefund: auditResult.totalRefund,
      newStatus: auditResult.status,
      newTotal: auditResult.total,
    });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    if (error.message.includes('not found') || error.message.includes('Max returnable') || error.message.includes('needs:') || error.message.includes('stock')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[Returns] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
