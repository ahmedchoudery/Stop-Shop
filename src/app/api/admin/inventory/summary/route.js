import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Inventory from '../../../../../models/Inventory';
import { requireAdmin } from '../../../../../lib/adminAuth';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const [summary] = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalProducts:  { $sum: 1 },
          totalStock:     { $sum: '$totalStock' },
          inStock:        { $sum: { $cond: [{ $eq: ['$status', 'In Stock'] }, 1, 0] } },
          lowStock:       { $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] } },
          outOfStock:     { $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] } },
        },
      },
    ]);

    const byCategory = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$totalStock' } } },
      { $sort: { totalStock: -1 } },
    ]);

    return NextResponse.json({ ...(summary ?? {}), byCategory });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
