import { withRoute, ApiError } from '@/lib/api/withRoute';
import Inventory from '@/models/Inventory';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import LowStockAlert from '@/models/LowStockAlert';
import { syncInventory } from '@/services/inventoryService';
import { getSalesVelocity } from '@/services/lowStockService';
import { z } from 'zod';

const safeGet = (obj, key) => {
  if (!obj || typeof obj !== 'object') return 0;
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return 0;
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc ? (desc.value ?? 0) : 0;
};

export const dynamic = 'force-dynamic';

export const GET = withRoute({
  requiredRole: 'admin',
  schema: {
    query: z.object({
      page: z.string().transform(val => Math.max(1, parseInt(val, 10))).optional().default('1'),
      limit: z.string().transform(val => Math.max(1, Math.min(100, parseInt(val, 10)))).optional().default('100'),
      type: z.enum(['inventory', 'alerts']).optional().default('inventory'),
    })
  },
  handler: async ({ query }) => {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    if (query.type === 'alerts') {
      const alerts = await LowStockAlert.find({})
        .sort({ createdAt: -1 })
        .lean();

      const enriched = await Promise.all(alerts.map(async (alert) => {
        const rawSku = alert.sku || '';
        const cleanSku = rawSku.replace(/^#/, '').trim();

        const product = await Product.findOne({
          $or: [
            { id: rawSku },
            { id: cleanSku },
            { sku: rawSku },
            { sku: cleanSku },
            { slug: rawSku },
            { slug: cleanSku },
            ...(rawSku.length === 24 ? [{ _id: rawSku }] : []),
            ...(cleanSku.length === 24 ? [{ _id: cleanSku }] : [])
          ]
        })
          .select('name image variantMatrix sizeStock colorStock quantity stock lowStockThreshold sizes colors')
          .lean();
        
        let currentStock = 0;
        let threshold = 5;
        if (product) {
          threshold = product.lowStockThreshold ?? 5;
          const colorAndSize = alert.variantId;
          if (colorAndSize === 'default') {
            currentStock = product.quantity ?? product.stock ?? 0;
          } else if (colorAndSize.includes('|')) {
            currentStock = safeGet(product.variantMatrix, colorAndSize);
          } else if (product.sizes?.includes(colorAndSize)) {
            currentStock = safeGet(product.sizeStock, colorAndSize);
          } else if (product.colors?.includes(colorAndSize)) {
            currentStock = safeGet(product.colorStock, colorAndSize);
          }
        }

        const salesVelocity = await getSalesVelocity(cleanSku || rawSku, alert.variantId);

        return {
          ...alert,
          _id: alert._id?.toString() || null,
          productName: product?.name || (cleanSku !== rawSku ? cleanSku : alert.sku),
          productImage: product?.image || '',
          currentStock: typeof currentStock === 'number' ? currentStock : 0,
          threshold,
          salesVelocity,
        };
      }));

      return new Response(JSON.stringify(enriched), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Clean up any legacy inventory records belonging to attitude outfits
    const attitudeProducts = await Product.find({
      $or: [{ featuredSection: 'attitude' }, { bucket: 'Outfit' }]
    }).select('id').lean();
    
    if (attitudeProducts.length > 0) {
      const attitudeIds = attitudeProducts.map(p => p.id).filter(Boolean);
      await Inventory.deleteMany({ productId: { $in: attitudeIds } });
    }

    const totalCount = await Inventory.countDocuments({});
    const inventory = await Inventory.find({})
      .select('productId sku name category totalStock sizeStock colorStock status updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = inventory.map((item) => ({
      ...item,
      _id: item._id?.toString() || null,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Total-Count': totalCount.toString(),
        'X-Total-Pages': Math.ceil(totalCount / limit).toString(),
        'X-Current-Page': page.toString(),
        'X-Limit': limit.toString(),
      }
    });
  }
});

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    body: z.object({
      action: z.enum(['snooze', 'restock', 'threshold', 'global-threshold']),
      sku: z.string().optional(),
      variantId: z.string().optional(),
      alertId: z.string().optional(),
      quantity: z.number().optional(),
      threshold: z.number().optional(),
    })
  },
  handler: async ({ body }) => {
    const { action, sku, variantId, alertId, quantity, threshold } = body;

    if (action === 'global-threshold') {
      const settings = await Settings.findOneAndUpdate(
        {},
        { lowStockThreshold: threshold },
        { upsert: true, new: true }
      );
      return { success: true, lowStockThreshold: settings.lowStockThreshold };
    }

    if (action === 'threshold') {
      if (!sku) throw new ApiError('BAD_REQUEST', 'Product sku is required', 400);
      const prd = await Product.findOneAndUpdate(
        { id: sku },
        { lowStockThreshold: threshold },
        { new: true }
      );
      if (!prd) throw new ApiError('NOT_FOUND', 'Product not found', 404);
      return { success: true, sku, lowStockThreshold: prd.lowStockThreshold };
    }

    let alert;
    if (alertId) {
      alert = await LowStockAlert.findById(alertId);
    } else if (sku && variantId) {
      alert = await LowStockAlert.findOne({ sku, variantId }).sort({ createdAt: -1 });
    }

    if (!alert) throw new ApiError('NOT_FOUND', 'Low stock alert not found', 404);

    if (action === 'snooze') {
      alert.snoozedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      alert.status = 'snoozed';
      await alert.save();
      return { success: true, alert };
    }

    if (action === 'restock') {
      const restockQty = quantity ?? 50;
      const product = await Product.findOne({ id: alert.sku });
      if (!product) throw new ApiError('NOT_FOUND', 'Product not found', 404);

      const colorAndSize = alert.variantId;
      let color = '';
      let size = '';
      let updateKey = 'quantity';

      if (colorAndSize !== 'default') {
        if (colorAndSize.includes('|')) {
          const lastPipeIndex = colorAndSize.lastIndexOf('|');
          color = colorAndSize.substring(0, lastPipeIndex);
          size = colorAndSize.substring(lastPipeIndex + 1);
          updateKey = `variantMatrix.${color}|${size}`;
        } else {
          if (product.sizes?.includes(colorAndSize)) {
            size = colorAndSize;
            updateKey = `sizeStock.${size}`;
          } else if (product.colors?.includes(colorAndSize)) {
            color = colorAndSize;
            updateKey = `colorStock.${color}`;
          }
        }
      }

      const productUpdate = { $inc: { [updateKey]: restockQty } };
      const updatedProduct = await Product.findOneAndUpdate(
        { id: alert.sku },
        productUpdate,
        { new: true }
      );

      await syncInventory(
        updatedProduct,
        'RESTOCK',
        `Restocked ${restockQty}x ${updatedProduct.name} variant "${colorAndSize}"`,
        `RESTOCK-${Date.now()}`,
        {}
      );

      alert.status = 'restocked';
      await alert.save();

      return { success: true, alert, currentStock: restockQty };
    }

    throw new ApiError('BAD_REQUEST', 'Invalid action', 400);
  }
});
