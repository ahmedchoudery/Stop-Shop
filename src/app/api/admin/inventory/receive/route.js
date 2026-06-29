import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Product from '../../../../../models/Product';
import { requireAdmin } from '../../../../../lib/adminAuth';
import { syncInventory } from '../../../../../services/inventoryService';
import { logAudit } from '../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../services/cacheService';

/**
 * POST /api/admin/inventory/receive
 * Supplier stock receiving workflow.
 * Body: {
 *   productId, supplierName, invoiceRef,
 *   quantity (simple) OR sizeStock OR colorStock OR matrixStock,
 *   note
 * }
 */
export async function POST(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, supplierName, invoiceRef, quantity, sizeStock, colorStock, matrixStock, note } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }
    if (!supplierName?.trim()) {
      return NextResponse.json({ error: 'supplierName is required' }, { status: 400 });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const prevStock = product.quantity ?? 0;

    // Matrix-level receiving (Color × Size)
    if (matrixStock && typeof matrixStock === 'object') {
      const matrix = product.variantMatrix instanceof Map
        ? Object.fromEntries(product.variantMatrix)
        : { ...(product.variantMatrix || {}) };

      for (const [key, qty] of Object.entries(matrixStock)) {
        const add = Math.max(0, parseInt(qty) || 0);
        matrix[key] = (parseInt(matrix[key]) || 0) + add;
      }

      product.variantMatrix = matrix;
      // Total recalculated by pre-save hook
    }
    // Color-level receiving
    else if (colorStock && typeof colorStock === 'object') {
      const currentColorStock = product.colorStock instanceof Map
        ? Object.fromEntries(product.colorStock)
        : { ...(product.colorStock || {}) };

      for (const [color, qty] of Object.entries(colorStock)) {
        const add = Math.max(0, parseInt(qty) || 0);
        currentColorStock[color] = (parseInt(currentColorStock[color]) || 0) + add;
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
        const add = Math.max(0, parseInt(qty) || 0);
        currentSizeStock[size] = (parseInt(currentSizeStock[size]) || 0) + add;
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
      return NextResponse.json({
        error: 'Provide quantity, sizeStock, colorStock, or matrixStock with positive values'
      }, { status: 400 });
    }

    await product.save();

    await syncInventory(
      product,
      'SUPPLIER_RECEIVE',
      note || `Received from ${supplierName}${invoiceRef ? ` (Invoice: ${invoiceRef})` : ''}`,
      null,
      { supplierName, invoiceRef: invoiceRef || '' }
    );

    await logAudit('SUPPLIER_RECEIVE', {
      productId,
      productName: product.name,
      supplierName,
      invoiceRef: invoiceRef || '',
      previousStock: prevStock,
      newStock: product.quantity,
      received: product.quantity - prevStock,
    }, adminPayload.email, req);

    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    const formatted = product.toObject();
    if (formatted._id) formatted._id = formatted._id.toString();

    return NextResponse.json({
      message: 'Stock received successfully',
      product: formatted,
      previousStock: prevStock,
      newStock: product.quantity,
      received: product.quantity - prevStock,
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('[SupplierReceive] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
