import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Inventory from '../../../../../models/Inventory';
import Product from '../../../../../models/Product';
import { requireAdmin, requireSuperAdmin } from '../../../../../lib/adminAuth';
import { syncInventory } from '../../../../../services/inventoryService';
import { logAudit } from '../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../services/cacheService';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { productId } = params;
    const entry = await Inventory.findOne({ productId }).lean();
    if (!entry) {
      return NextResponse.json({ error: 'Inventory entry not found' }, { status: 404 });
    }

    if (entry._id) {
      entry._id = entry._id.toString();
    }

    return NextResponse.json(entry);
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
    const adminPayload = requireSuperAdmin(req);

    const { productId } = params;
    const entry = await Inventory.findOne({ productId }).lean();
    if (!entry) {
      return NextResponse.json({ error: 'Inventory entry not found' }, { status: 404 });
    }

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
      'Admin deleted inventory and product'
    );

    const product = await Product.findOneAndDelete({ id: productId });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await logAudit('INVENTORY_DELETE', { productId, name: entry.name }, adminPayload.email, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    return NextResponse.json({ message: 'Inventory and product deleted successfully' });
  } catch (error) {
    if (error.message.includes('Authentication required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('required') ? 401 : 403 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
