import { withRoute, ApiError } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import { syncInventory } from '@/services/inventoryService';
import { withAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { z } from 'zod';

export const POST = withRoute({
  requiredRole: 'staff',
  schema: {
    params: z.object({
      productId: z.string().min(1)
    }),
    body: z.object({
      quantity: z.number().optional(),
      sizeStock: z.record(z.any()).optional(),
      colorStock: z.record(z.any()).optional(),
      note: z.string().optional().default(''),
    })
  },
  handler: async ({ req, body, params }) => {
    const { productId } = params;
    const { quantity, sizeStock, colorStock, note } = body;

    const product = await Product.findOne({ id: productId });
    if (!product) {
      throw new ApiError('NOT_FOUND', 'Product not found', 404);
    }

    const prevStock = product.quantity ?? 0;

    if (colorStock && typeof colorStock === 'object') {
      const updated = {};
      
      const currentColorStock = product.colorStock instanceof Map 
        ? Object.fromEntries(product.colorStock) 
        : (product.colorStock || {});
        
      for (const [color, qty] of Object.entries(currentColorStock)) {
        Reflect.set(updated, color, parseInt(qty) || 0);
      }
      
      for (const [color, qty] of Object.entries(colorStock)) {
        const n = Math.max(0, parseInt(qty) || 0);
        const cur = parseInt(Reflect.get(updated, color)) || 0;
        Reflect.set(updated, color, cur + n);
      }
      
      product.colorStock = updated;
      product.quantity = Object.values(updated).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    } else if (sizeStock && typeof sizeStock === 'object') {
      const updated = {};
      
      const currentSizeStock = product.sizeStock instanceof Map 
        ? Object.fromEntries(product.sizeStock) 
        : (product.sizeStock || {});
        
      for (const [size, qty] of Object.entries(currentSizeStock)) {
        Reflect.set(updated, size, parseInt(qty) || 0);
      }
      
      for (const [size, qty] of Object.entries(sizeStock)) {
        const n = Math.max(0, parseInt(qty) || 0);
        const cur = parseInt(Reflect.get(updated, size)) || 0;
        Reflect.set(updated, size, cur + n);
      }
      
      product.sizeStock = updated;
      product.quantity = Object.values(updated).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    } else if (typeof quantity === 'number' && quantity > 0) {
      product.quantity = prevStock + quantity;
      product.stock = product.quantity;
    } else {
      throw new ApiError('VALIDATION', 'Provide either quantity (number), sizeStock (object), or colorStock (object)', 400);
    }

    await withAudit(
      'INVENTORY_RESTOCK',
      productId,
      req,
      { previousStock: prevStock },
      { newTotal: product.quantity, added: product.quantity - prevStock, note: note || '' },
      async (session) => {
        await product.save({ session });
        await syncInventory(
          product,
          'RESTOCK',
          note || `Admin restocked ${product.quantity - prevStock} units`,
          null,
          {},
          session
        );
      }
    );
    
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    const formattedProduct = product.toObject();
    if (formattedProduct._id) {
      formattedProduct._id = formattedProduct._id.toString();
    }

    return { message: 'Restock successful', product: formattedProduct };
  }
});
