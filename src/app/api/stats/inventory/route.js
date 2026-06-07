import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Product from '../../../../models/Product';
import { requireAdmin } from '../../../../lib/adminAuth';
import { cacheService, CACHE_KEYS } from '../../../../services/cacheService';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await cacheService.getOrSet(CACHE_KEYS.STATS_INVENTORY, async () => {
      const [total, lowStock, outOfStock, rawProducts] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ quantity: { $gt: 0, $lt: 5 } }),
        Product.countDocuments({ quantity: 0 }),
        Product.find({}, { id: 1, name: 1, quantity: 1, bucket: 1 }).lean(),
      ]);
      const products = rawProducts.map(p => ({
        ...p,
        _id: p._id?.toString() || null,
      }));
      return { total, lowStock, outOfStock, products };
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
