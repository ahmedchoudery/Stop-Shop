import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Product from '../../../../../models/Product';
import { requireAdmin } from '../../../../../lib/adminAuth';
import { syncInventory } from '../../../../../services/inventoryService';
import { logAudit } from '../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../services/cacheService';

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

/**
 * GET /api/admin/inventory/adjust
 * Returns the list of valid adjustment reasons.
 */
export async function GET(req) {
  try {
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ reasons: ADJUSTMENT_REASONS });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/inventory/adjust
 * Manual stock adjustment with a required reason.
 * Body: { productId, adjustment (number, +/-), reason (string), note (string) }
 * Optionally pass sizeStock, colorStock, or variantMatrix changes.
 */
export async function POST(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, adjustment, reason, note, sizeAdjust, colorAdjust, matrixAdjust } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }
    if (!reason || !ADJUSTMENT_REASONS.includes(reason)) {
      return NextResponse.json({
        error: `Reason is required. Valid reasons: ${ADJUSTMENT_REASONS.join(', ')}`
      }, { status: 400 });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const prevStock = product.quantity ?? 0;

    // Matrix-level adjustments (Color × Size)
    if (matrixAdjust && typeof matrixAdjust === 'object') {
      const matrix = product.variantMatrix instanceof Map
        ? Object.fromEntries(product.variantMatrix)
        : { ...(product.variantMatrix || {}) };

      for (const [key, delta] of Object.entries(matrixAdjust)) {
        const current = parseInt(matrix[key]) || 0;
        matrix[key] = Math.max(0, current + parseInt(delta));
      }

      product.variantMatrix = matrix;
      // Total will be recalculated by pre-save hook
    }
    // Color-level adjustments
    else if (colorAdjust && typeof colorAdjust === 'object') {
      const colorStock = product.colorStock instanceof Map
        ? Object.fromEntries(product.colorStock)
        : { ...(product.colorStock || {}) };

      for (const [color, delta] of Object.entries(colorAdjust)) {
        const current = parseInt(colorStock[color]) || 0;
        colorStock[color] = Math.max(0, current + parseInt(delta));
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
        const current = parseInt(sizeStock[size]) || 0;
        sizeStock[size] = Math.max(0, current + parseInt(delta));
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
      return NextResponse.json({
        error: 'Provide adjustment (number), sizeAdjust, colorAdjust, or matrixAdjust'
      }, { status: 400 });
    }

    await product.save();

    await syncInventory(
      product,
      'MANUAL_ADJUST',
      note || `Manual adjustment: ${reason}`,
      null,
      { adjustmentReason: reason }
    );

    await logAudit('INVENTORY_MANUAL_ADJUST', {
      productId,
      productName: product.name,
      previousStock: prevStock,
      newStock: product.quantity,
      reason,
      note: note || '',
    }, adminPayload.email, req);

    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    const formatted = product.toObject();
    if (formatted._id) formatted._id = formatted._id.toString();

    return NextResponse.json({
      message: 'Adjustment applied',
      product: formatted,
      previousStock: prevStock,
      newStock: product.quantity,
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('[ManualAdjust] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
