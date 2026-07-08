import { withRoute, ApiError } from '@/lib/api/withRoute';
import Inventory from '@/models/Inventory';
import Product from '@/models/Product';
import { syncInventory } from '@/services/inventoryService';
import { withAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { z } from 'zod';

export const GET = withRoute({
  requiredRole: 'staff',
  schema: {
    params: z.object({
      productId: z.string().min(1)
    })
  },
  handler: async ({ params }) => {
    const { productId } = params;
    const entry = await Inventory.findOne({ productId }).lean();
    if (!entry) {
      throw new ApiError('NOT_FOUND', 'Inventory entry not found', 404);
    }

    const formatted = { ...entry };
    if (formatted._id) {
      formatted._id = formatted._id.toString();
    }

    return formatted;
  }
});

export const DELETE = withRoute({
  requiredRole: 'admin',
  schema: {
    params: z.object({
      productId: z.string().min(1)
    })
  },
  handler: async ({ req, params }) => {
    const { productId } = params;
    const entry = await Inventory.findOne({ productId }).lean();
    if (!entry) {
      throw new ApiError('NOT_FOUND', 'Inventory entry not found', 404);
    }

    await withAudit(
      'INVENTORY_DELETE',
      productId,
      req,
      entry,
      null,
      async (session) => {
        await syncInventory(
          {
            id: productId,
            name: entry.name,
            quantity: 0,
            bucket: entry.category,
            subCategory: entry.subCategory,
            price: entry.price,
            image: entry.image,
            rating: entry.rating,
            colors: entry.colorVariants,
            sizes: entry.sizes,
            sizeStock: entry.sizeStock,
            colorStock: entry.colorStock,
          },
          'ADMIN_DELETE',
          'Admin deleted inventory and product',
          null,
          {},
          session
        );
        await Product.findOneAndDelete({ id: productId }, { session });
      }
    );

    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    return { message: 'Inventory and product deleted successfully' };
  }
});
