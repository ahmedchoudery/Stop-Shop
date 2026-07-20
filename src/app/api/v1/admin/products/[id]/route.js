import { revalidatePath } from 'next/cache';
import { withRoute, ApiError } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';
import { updateProductSchema } from '@/schemas/validation';
import { syncInventory } from '@/services/inventoryService';
import { withAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import mongoose from 'mongoose';
import { z } from 'zod';

const buildIdQuery = (idParam) => {
  return mongoose.isValidObjectId(idParam)
    ? { $or: [{ id: idParam }, { _id: idParam }] }
    : { id: idParam };
};

export const PATCH = withRoute({
  requiredRole: 'staff',
  schema: {
    params: z.object({
      id: z.string().min(1)
    }),
    body: updateProductSchema
  },
  handler: async ({ req, body, params }) => {
    const { id } = params;

    const updateData = { ...body };

    if (updateData.featuredSection) {
      const getSectionName = (sec) => {
        if (sec === 'drop') return 'The Drop';
        if (sec === 'attitude') return 'Defined by Attitude';
        if (sec === 'pieces') return 'Pieces That Speak';
        return 'Collection';
      };
      updateData.sectionName = getSectionName(updateData.featuredSection);
      if (updateData.featuredSection === 'attitude') {
        updateData.bucket = 'Outfit';
        updateData.subCategory = 'Outfit';
      }
    }

    let computedQuantity = null;

    // Mode 1: variantMatrix — both colors AND sizes (highest priority)
    if (updateData.variantMatrix && typeof updateData.variantMatrix === 'object' && Object.keys(updateData.variantMatrix).length > 0) {
      computedQuantity = Object.values(updateData.variantMatrix)
        .reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      // Derive per-axis sums from the matrix
      const colorSums = {};
      const sizeSums = {};
      for (const [key, qty] of Object.entries(updateData.variantMatrix)) {
        const lastPipeIndex = key.lastIndexOf('|');
        const color = lastPipeIndex !== -1 ? key.substring(0, lastPipeIndex) : key;
        const size = lastPipeIndex !== -1 ? key.substring(lastPipeIndex + 1) : '';
        if (color) {
          const cur = parseInt(Reflect.get(colorSums, color)) || 0;
          Reflect.set(colorSums, color, cur + Math.max(0, parseInt(qty) || 0));
        }
        if (size) {
          const cur = parseInt(Reflect.get(sizeSums, size)) || 0;
          Reflect.set(sizeSums, size, cur + Math.max(0, parseInt(qty) || 0));
        }
      }
      updateData.colorStock = colorSums;
      updateData.sizeStock  = sizeSums;

    // Mode 2: colorStock only
    } else if (updateData.colorStock && typeof updateData.colorStock === 'object' && Object.keys(updateData.colorStock).length > 0) {
      computedQuantity = Object.values(updateData.colorStock)
        .reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      updateData.variantMatrix = {};  // clear matrix if present

    // Mode 3: sizeStock only
    } else if (updateData.sizeStock && typeof updateData.sizeStock === 'object' && Object.keys(updateData.sizeStock).length > 0) {
      computedQuantity = Object.values(updateData.sizeStock)
        .reduce((sum, n) => sum + Math.max(0, parseInt(n) || 0), 0);
      updateData.variantMatrix = {};  // clear matrix if present
    }

    if (computedQuantity !== null) {
      updateData.quantity = computedQuantity;
      updateData.stock    = computedQuantity;
    }

    const prevProduct = await Inventory.findOne({ productId: id }).lean();
    const prevStock   = prevProduct?.totalStock ?? 0;

    try {
      const product = await withAudit(
        'PRODUCT_UPDATE',
        id,
        req,
        prevProduct,
        updateData,
        async (session) => {
          const p = await Product.findOneAndUpdate(
            buildIdQuery(id),
            updateData,
            { new: true, runValidators: true, context: 'query', session }
          );
          if (!p) {
            throw new ApiError('NOT_FOUND', 'Product not found', 404);
          }
          const moveType = p.quantity > prevStock ? 'RESTOCK' : 'ADMIN_UPDATE';
          await syncInventory(p, moveType, `Admin updated: ${Object.keys(body).join(', ')}`, null, {}, session);
          return p;
        }
      );

      await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
      try {
        revalidatePath('/');
      } catch (e) {
        console.warn('[ISR Revalidate] Failed to revalidate /:', e.message);
      }

      const formattedProduct = product.toObject ? product.toObject() : product;
      if (formattedProduct._id) {
        formattedProduct._id = formattedProduct._id.toString();
      }

      return formattedProduct;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err.message === 'Product not found') {
        throw new ApiError('NOT_FOUND', 'Product not found', 404);
      }
      throw err;
    }
  }
});

export const DELETE = withRoute({
  requiredRole: 'staff',
  schema: {
    params: z.object({
      id: z.string().min(1)
    })
  },
  handler: async ({ req, params }) => {
    const { id } = params;

    const product = await Product.findOne(buildIdQuery(id)).lean();
    if (!product) {
      throw new ApiError('NOT_FOUND', 'Product not found', 404);
    }

    await withAudit(
      'PRODUCT_DELETE',
      id,
      req,
      product,
      null,
      async (session) => {
        await Product.findOneAndDelete(buildIdQuery(id), { session });
        await Inventory.deleteOne({ productId: id }, { session });
      }
    );

    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
    try {
      revalidatePath('/');
    } catch (e) {
      console.warn('[ISR Revalidate] Failed to revalidate /:', e.message);
    }

    return { message: 'Product removed' };
  }
});
