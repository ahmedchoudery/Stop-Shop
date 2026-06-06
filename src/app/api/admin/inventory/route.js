import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Inventory from '../../../../models/Inventory';
import { requireAdmin } from '../../../../lib/adminAuth';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const inventory = await Inventory.find().sort({ updatedAt: -1 }).lean();
    const formatted = inventory.map(item => ({
      ...item,
      _id: item._id?.toString() || null,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
