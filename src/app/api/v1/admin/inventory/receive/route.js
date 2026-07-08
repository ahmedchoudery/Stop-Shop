import { withRoute, ApiError } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import { syncInventory } from '@/services/inventoryService';
import { withAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { z } from 'zod';

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    body: z.object({
      productId: z.string().min(1),
      supplierName: z.string().min(1),
      invoiceRef: z.string().optional().default(''),
      quantity: z.number().optional(),
      sizeStock: z.record(z.any()).optional(),
      colorStock: z.record(z.any()).optional(),
      matrixStock: z.record(z.any()).optional(),
      note: z.string().optional().default(''),
    })
  },
  handler: async ({ req, body }) => {
    const { productId, supplierName, invoiceRef, quantity, sizeStock, colorStock, matrixStock, note } = body;

    const product = await Product.findOne({ id: productId });
    if (!product) {
      throw new ApiError('NOT_FOUND', 'Product not found', 404);
    }

    const prevStock = product.quantity ?? 0;

    // Matrix-level receiving (Color × Size)
    if (matrixStock && typeof matrixStock === 'object') {
      const matrix = product.variantMatrix instanceof Map
        ? Object.fromEntries(product.variantMatrix)
        : { ...(product.variantMatrix || {}) };

      for (const [key, qty] of Object.entries(matrixStock)) {
        if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(matrix, key)) {
          const add = Math.max(0, parseInt(qty) || 0);
          const current = parseInt(Reflect.get(matrix, key)) || 0;
          Reflect.set(matrix, key, current + add);
        }
      }

      product.variantMatrix = matrix;
    }
    // Color-level receiving
    else if (colorStock && typeof colorStock === 'object') {
      const currentColorStock = product.colorStock instanceof Map
        ? Object.fromEntries(product.colorStock)
        : { ...(product.colorStock || {}) };

      for (const [color, qty] of Object.entries(colorStock)) {
        if (typeof color === 'string' && Object.prototype.hasOwnProperty.call(currentColorStock, color)) {
          const add = Math.max(0, parseInt(qty) || 0);
          const current = parseInt(Reflect.get(currentColorStock, color)) || 0;
          Reflect.set(currentColorStock, color, current + add);
        }
      }

      product.colorStock = currentColorStock;
      product.quantity = Object.values(currentColorStock).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    }
    // Size-level receiving
    else if (sizeStock && typeof sizeStock === 'object') {
      const currentSizeStock = product.sizeStock instanceof Map
        ? Object.fromEntries(product.sizeStock)
        : { ...(product.sizeStock || {}) };

      for (const [size, qty] of Object.entries(sizeStock)) {
        if (typeof size === 'string' && Object.prototype.hasOwnProperty.call(currentSizeStock, size)) {
          const add = Math.max(0, parseInt(qty) || 0);
          const current = parseInt(Reflect.get(currentSizeStock, size)) || 0;
          Reflect.set(currentSizeStock, size, current + add);
        }
      }

      product.sizeStock = currentSizeStock;
      product.quantity = Object.values(currentSizeStock).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    }
    // Simple quantity receiving
    else if (typeof quantity === 'number' && quantity > 0) {
      product.quantity = prevStock + quantity;
      product.stock = product.quantity;
    } else {
      throw new ApiError('VALIDATION', 'Provide quantity, sizeStock, colorStock, or matrixStock with positive values', 400);
    }

    await withAudit(
      'SUPPLIER_RECEIVE',
      productId,
      req,
      { previousStock: prevStock },
      { newStock: product.quantity, received: product.quantity - prevStock },
      async (session) => {
        await product.save({ session });
        await syncInventory(
          product,
          'SUPPLIER_RECEIVE',
          note || `Received from ${supplierName}${invoiceRef ? ` (Invoice: ${invoiceRef})` : ''}`,
          null,
          { supplierName, invoiceRef: invoiceRef || '' },
          session
        );
      }
    );

    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    const formatted = product.toObject();
    if (formatted._id) formatted._id = formatted._id.toString();

    return {
      message: 'Stock received successfully',
      product: formatted,
      previousStock: prevStock,
      newStock: product.quantity,
      received: product.quantity - prevStock,
    };
  }
});
