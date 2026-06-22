import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Product from '../../../../../models/Product';
import Inventory from '../../../../../models/Inventory';
import { requireAdmin } from '../../../../../lib/adminAuth';
import { updateProductSchema } from '../../../../../schemas/validation';
import { syncInventory } from '../../../../../services/inventoryService';
import { logAudit } from '../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../services/cacheService';
import mongoose from 'mongoose';

const buildIdQuery = (idParam) => {
  return mongoose.isValidObjectId(idParam)
    ? { $or: [{ id: idParam }, { _id: idParam }] }
    : { id: idParam };
};

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const updateData = { ...validation.data };

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
      const sizeSums  = {};
      for (const [key, qty] of Object.entries(updateData.variantMatrix)) {
        const [color, size] = key.split('|');
        if (color) colorSums[color] = (colorSums[color] || 0) + Math.max(0, parseInt(qty) || 0);
        if (size)  sizeSums[size]   = (sizeSums[size]   || 0) + Math.max(0, parseInt(qty) || 0);
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

    const product = await Product.findOneAndUpdate(
      buildIdQuery(id),
      updateData,
      { new: true, runValidators: true, context: 'query' }
    );
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const prevProduct = await Inventory.findOne({ productId: id }).lean();
    const prevStock   = prevProduct?.totalStock ?? 0;
    const moveType    = product.quantity > prevStock ? 'RESTOCK' : 'ADMIN_UPDATE';

    await syncInventory(product, moveType, `Admin updated: ${Object.keys(body).join(', ')}`);
    await logAudit('PRODUCT_UPDATE', { id, changes: Object.keys(body) }, adminPayload.email, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    const formattedProduct = product.toObject();
    if (formattedProduct._id) {
      formattedProduct._id = formattedProduct._id.toString();
    }

    return NextResponse.json(formattedProduct);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    const product = await Product.findOneAndDelete(buildIdQuery(id));
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await logAudit('PRODUCT_DELETE', { id, name: product.name }, adminPayload.email, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    return NextResponse.json({ message: 'Product removed' });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
