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
      const settings = await Settings.findOne({}).lean();
      const globalThreshold = settings?.lowStockThreshold ?? 10;
      
      // Auto-scan store catalog for low-stock products & register alerts
      const catalogProducts = await Product.find({
        featuredSection: { $ne: 'attitude' },
        bucket: { $ne: 'Outfit' }
      }).lean();

      const todayStr = new Date().toISOString().split('T')[0];

      for (const p of catalogProducts) {
        const pThreshold = p.lowStockThreshold ?? globalThreshold;
        const totalQty = p.quantity ?? p.stock ?? 0;
        const pSku = p.id || p.sku || p._id?.toString();

        if (pSku && totalQty <= pThreshold) {
          await LowStockAlert.findOneAndUpdate(
            { sku: pSku, variantId: 'default', date: todayStr },
            { $setOnInsert: { sku: pSku, variantId: 'default', date: todayStr, status: 'active' } },
            { upsert: true }
          ).catch(() => {});
        }
      }

      const alerts = await LowStockAlert.find({})
        .sort({ createdAt: -1 })
        .lean();

      // Deduplicate: keep only one alert per SKU (the most recent)
      const seenSkus = new Set();
      const dedupedAlerts = [];
      for (const a of alerts) {
        const key = a.sku || '';
        if (seenSkus.has(key)) continue;
        seenSkus.add(key);
        dedupedAlerts.push(a);
      }

      const enrichedResults = await Promise.all(dedupedAlerts.map(async (alert) => {
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
        }).lean();

        if (!product) {
          // Delete orphan alert referencing non-existent product
          await LowStockAlert.deleteMany({ sku: rawSku }).catch(() => {});
          await LowStockAlert.deleteMany({ sku: cleanSku }).catch(() => {});
          await LowStockAlert.deleteOne({ _id: alert._id }).catch(() => {});
          return null;
        }

        // Safely convert Mongoose Maps → plain objects
        const toObj = (val) => {
          if (!val) return {};
          if (val instanceof Map) return Object.fromEntries(val);
          if (typeof val === 'object' && val.constructor === Object) return val;
          // lean() on older Mongoose may return a Map-like with _doc
          if (val._doc) return Object.fromEntries(Object.entries(val._doc));
          return {};
        };

        const threshold = product.lowStockThreshold ?? globalThreshold;
        const colors = product.colors || [];
        const sizes = product.sizes || [];
        const colorStock = toObj(product.colorStock);
        const sizeStock = toObj(product.sizeStock);
        const variantMatrix = toObj(product.variantMatrix);

        // Compute current stock for the alert's variantId
        let currentStock = 0;
        const colorAndSize = alert.variantId;
        if (colorAndSize === 'default') {
          currentStock = product.quantity ?? product.stock ?? 0;
        } else if (colorAndSize.includes('|')) {
          currentStock = safeGet(variantMatrix, colorAndSize);
        } else if (sizes.includes(colorAndSize)) {
          currentStock = safeGet(sizeStock, colorAndSize);
        } else if (colors.includes(colorAndSize)) {
          currentStock = safeGet(colorStock, colorAndSize);
        }

        const salesVelocity = await getSalesVelocity(cleanSku || rawSku, alert.variantId);

        return {
          ...alert,
          _id: alert._id?.toString() || null,
          productName: product.name || '',
          productImage: product.image || (product.gallery?.[0]) || '',
          colors,
          sizes,
          colorStock,
          sizeStock,
          variantMatrix,
          totalProductStock: product.quantity ?? product.stock ?? 0,
          currentStock: typeof currentStock === 'number' ? currentStock : 0,
          threshold,
          salesVelocity,
        };
      }));

      const enriched = enrichedResults.filter(Boolean);

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
      action: z.enum(['snooze', 'unsnooze', 'restock', 'threshold', 'global-threshold']),
      sku: z.string().optional(),
      variantId: z.string().optional(),
      alertId: z.string().optional(),
      color: z.string().optional(),
      size: z.string().optional(),
      quantity: z.number().optional(),
      items: z.array(z.object({
        color: z.string().optional(),
        size: z.string().optional(),
        quantity: z.number()
      })).optional(),
      threshold: z.number().optional(),
    })
  },
  handler: async ({ body }) => {
    const { action, sku, variantId, alertId, color, size, quantity, items, threshold } = body;

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

    if (action === 'unsnooze') {
      alert.snoozedUntil = null;
      alert.status = 'active';
      await alert.save();
      return { success: true, alert };
    }

    if (action === 'restock') {
      const rawSku = alert.sku || sku || '';
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
      });

      if (!product) throw new ApiError('NOT_FOUND', 'Product not found', 404);

      let totalRestockQty = 0;
      const productUpdate = { $inc: {} };

      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const qty = Math.max(1, parseInt(item.quantity) || 0);
          if (qty <= 0) continue;
          totalRestockQty += qty;

          const selColor = item.color || '';
          const selSize = item.size || '';

          if (selColor && selSize) {
            productUpdate.$inc[`variantMatrix.${selColor}|${selSize}`] = (productUpdate.$inc[`variantMatrix.${selColor}|${selSize}`] || 0) + qty;
          } else if (selColor) {
            productUpdate.$inc[`colorStock.${selColor}`] = (productUpdate.$inc[`colorStock.${selColor}`] || 0) + qty;
          } else if (selSize) {
            productUpdate.$inc[`sizeStock.${selSize}`] = (productUpdate.$inc[`sizeStock.${selSize}`] || 0) + qty;
          }
        }
      } else {
        const restockQty = Math.max(1, quantity ?? 50);
        totalRestockQty = restockQty;

        const selColor = color ?? (alert.variantId?.includes('|') ? alert.variantId.split('|')[0] : (product.colors?.includes(alert.variantId) ? alert.variantId : ''));
        const selSize = size ?? (alert.variantId?.includes('|') ? alert.variantId.split('|').slice(-1)[0] : (product.sizes?.includes(alert.variantId) ? alert.variantId : ''));

        if (selColor && selSize) {
          productUpdate.$inc[`variantMatrix.${selColor}|${selSize}`] = restockQty;
        } else if (selColor) {
          productUpdate.$inc[`colorStock.${selColor}`] = restockQty;
        } else if (selSize) {
          productUpdate.$inc[`sizeStock.${selSize}`] = restockQty;
        }
      }

      productUpdate.$inc.quantity = totalRestockQty;
      productUpdate.$inc.stock = totalRestockQty;

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id },
        productUpdate,
        { new: true }
      );

      await syncInventory(
        updatedProduct,
        'RESTOCK',
        `Restocked +${totalRestockQty} units of ${updatedProduct.name}`,
        `RESTOCK-${Date.now()}`,
        {}
      );

      alert.status = 'restocked';
      await alert.save();

      return { success: true, alert, updatedProduct };
    }

    throw new ApiError('BAD_REQUEST', 'Invalid action', 400);
  }
});
