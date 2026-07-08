import { withRoute, ApiError } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import { syncInventory } from '@/services/inventoryService';
import { withAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { z } from 'zod';

const ADJUSTMENT_REASONS = [
  'Damaged Goods',
  'Stocktake Audit',
  'Theft / Shrinkage',
  'Quality Control Rejection',
  'Sample / Display',
  'Expired / Deteriorated',
  'Data Entry Correction',
  'Other',
];

export const GET = withRoute({
  requiredRole: 'admin',
  handler: async () => {
    return { reasons: ADJUSTMENT_REASONS };
  }
});

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    body: z.object({
      productId: z.string().min(1),
      adjustment: z.number().optional(),
      reason: z.enum(ADJUSTMENT_REASONS),
      note: z.string().optional().default(''),
      sizeAdjust: z.record(z.any()).optional(),
      colorAdjust: z.record(z.any()).optional(),
      matrixAdjust: z.record(z.any()).optional(),
    })
  },
  handler: async ({ req, body }) => {
    const { productId, adjustment, reason, note, sizeAdjust, colorAdjust, matrixAdjust } = body;

    const product = await Product.findOne({ id: productId });
    if (!product) {
      throw new ApiError('NOT_FOUND', 'Product not found', 404);
    }

    const prevStock = product.quantity ?? 0;

    // Matrix-level adjustments (Color × Size)
    if (matrixAdjust && typeof matrixAdjust === 'object') {
      const matrix = product.variantMatrix instanceof Map
        ? Object.fromEntries(product.variantMatrix)
        : { ...(product.variantMatrix || {}) };

      for (const [key, delta] of Object.entries(matrixAdjust)) {
        if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(matrix, key)) {
          const current = parseInt(Reflect.get(matrix, key)) || 0;
          Reflect.set(matrix, key, Math.max(0, current + parseInt(delta)));
        }
      }

      product.variantMatrix = matrix;
    }
    // Color-level adjustments
    else if (colorAdjust && typeof colorAdjust === 'object') {
      const colorStock = product.colorStock instanceof Map
        ? Object.fromEntries(product.colorStock)
        : { ...(product.colorStock || {}) };

      for (const [color, delta] of Object.entries(colorAdjust)) {
        if (typeof color === 'string' && Object.prototype.hasOwnProperty.call(colorStock, color)) {
          const current = parseInt(Reflect.get(colorStock, color)) || 0;
          Reflect.set(colorStock, color, Math.max(0, current + parseInt(delta)));
        }
      }

      product.colorStock = colorStock;
      product.quantity = Object.values(colorStock).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    }
    // Size-level adjustments
    else if (sizeAdjust && typeof sizeAdjust === 'object') {
      const sizeStock = product.sizeStock instanceof Map
        ? Object.fromEntries(product.sizeStock)
        : { ...(product.sizeStock || {}) };

      for (const [size, delta] of Object.entries(sizeAdjust)) {
        if (typeof size === 'string' && Object.prototype.hasOwnProperty.call(sizeStock, size)) {
          const current = parseInt(Reflect.get(sizeStock, size)) || 0;
          Reflect.set(sizeStock, size, Math.max(0, current + parseInt(delta)));
        }
      }

      product.sizeStock = sizeStock;
      product.quantity = Object.values(sizeStock).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    }
    // Simple quantity adjustment
    else if (typeof adjustment === 'number') {
      product.quantity = Math.max(0, prevStock + adjustment);
      product.stock = product.quantity;
    } else {
      throw new ApiError('VALIDATION', 'Provide adjustment (number), sizeAdjust, colorAdjust, or matrixAdjust', 400);
    }

    await withAudit(
      'INVENTORY_MANUAL_ADJUST',
      productId,
      req,
      { previousStock: prevStock, reason },
      { newStock: product.quantity, note: note || '' },
      async (session) => {
        await product.save({ session });
        await syncInventory(
          product,
          'MANUAL_ADJUST',
          note || `Manual adjustment: ${reason}`,
          null,
          { adjustmentReason: reason },
          session
        );
      }
    );

    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    const formatted = product.toObject();
    if (formatted._id) formatted._id = formatted._id.toString();

    return {
      message: 'Adjustment applied',
      product: formatted,
      previousStock: prevStock,
      newStock: product.quantity,
    };
  }
});
