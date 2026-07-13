import { withRoute, ApiError } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { syncInventory } from '@/services/inventoryService';
import { withAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { transitionOrder } from '@/lib/orders/state';
import { z } from 'zod';

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    params: z.object({
      id: z.string().min(1)
    }),
    body: z.object({
      items: z.array(z.object({
        itemId: z.string().min(1),
        quantity: z.number().int().positive(),
        reason: z.string().min(1),
        type: z.enum(['Return', 'Exchange']),
        exchangeForId: z.string().optional(),
        exchangeForSize: z.string().optional(),
        exchangeForColor: z.string().optional(),
      })).min(1)
    })
  },
  handler: async ({ req, body, params, user }) => {
    const { id } = params;
    const { items } = body;

    const order = await Order.findOne({ orderID: id });
    if (!order) {
      throw new ApiError('NOT_FOUND', 'Order not found', 404);
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

          const orderItem = order.items.find((i) => i.id === itemId);
          if (!orderItem) {
            throw new ApiError('VALIDATION', `Item ${itemId} not found in order ${id}`, 400);
          }

          const alreadyReturned = (order.returnedItems || [])
            .filter((r) => r.itemId === itemId)
            .reduce((sum, r) => sum + r.quantity, 0);

          if (quantity > orderItem.quantity - alreadyReturned) {
            throw new ApiError('VALIDATION', `Cannot return ${quantity} of ${orderItem.name}. Max returnable: ${orderItem.quantity - alreadyReturned}`, 400);
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
              Reflect.set(restockUpdate.$inc, `variantMatrix.${color}|${size}`, quantity);
              Reflect.set(restockUpdate.$inc, `colorStock.${color}`, quantity);
              Reflect.set(restockUpdate.$inc, `sizeStock.${size}`, quantity);
            } else if (size) {
              Reflect.set(restockUpdate.$inc, `sizeStock.${size}`, quantity);
            } else if (color) {
              Reflect.set(restockUpdate.$inc, `colorStock.${color}`, quantity);
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
              throw new ApiError('VALIDATION', `Exchange product ${exchangeForId} not found`, 400);
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
              Reflect.set(exchangeUpdate.$inc, mk, -quantity);
              Reflect.set(exchangeUpdate.$inc, `colorStock.${exColor}`, -quantity);
              Reflect.set(exchangeUpdate.$inc, `sizeStock.${exSize}`, -quantity);
              Reflect.set(availCheck, mk, { $gte: quantity });
            } else if (exSize) {
              Reflect.set(exchangeUpdate.$inc, `sizeStock.${exSize}`, -quantity);
              Reflect.set(availCheck, `sizeStock.${exSize}`, { $gte: quantity });
            } else if (exColor) {
              Reflect.set(exchangeUpdate.$inc, `colorStock.${exColor}`, -quantity);
              Reflect.set(availCheck, `colorStock.${exColor}`, { $gte: quantity });
            }

            const updatedExchangeProduct = await Product.findOneAndUpdate(
              availCheck,
              exchangeUpdate,
              { new: true, session }
            );

            if (!updatedExchangeProduct) {
              throw new ApiError('VALIDATION', `Insufficient stock for exchange product: ${exchangeProduct.name}`, 400);
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
            processedBy: user?.email || '',
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

        let targetStatus = order.status;
        if (totalReturnedQty >= totalOrderedQty) {
          targetStatus = 'Returned';
        } else if (totalReturnedQty > 0) {
          targetStatus = 'Partially Returned';
        }

        if (totalRefund > 0) {
          order.total = Math.max(0, order.total - totalRefund);
        }

        if (targetStatus !== order.status) {
          await transitionOrder(order, targetStatus, user?.id || 'system', { action: 'return', totalReturnedQty }, session);
        } else {
          await order.save({ session });
        }
        return { totalRefund, results, status: order.status, total: order.total };
      }
    );

    await cacheService.invalidateMany([
      CACHE_KEYS.STATS_REVENUE,
      CACHE_KEYS.STATS_ORDERS,
      CACHE_KEYS.STATS_INVENTORY,
      CACHE_KEYS.PUBLIC_PRODUCTS,
    ]);

    return {
      message: 'Return/exchange processed',
      orderID: id,
      results: auditResult.results,
      totalRefund: auditResult.totalRefund,
      newStatus: auditResult.status,
      newTotal: auditResult.total,
    };
  }
});
