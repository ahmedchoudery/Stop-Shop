import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Product from '../../../../models/Product';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section');

    const query = section ? { featuredSection: section } : { featuredSection: { $in: ['drop', 'attitude', 'pieces'] } };

    const products = await Product.find(query).sort({ displayOrder: 1, createdAt: -1 }).lean();

    const data = products.map(p => ({
      ...p,
      _id: p._id?.toString(),
      id: p.id || p._id?.toString(),
      bucket: p.bucket || 'Tops',
      subCategory: p.subCategory || 'Tshirt',
    }));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch featured products' }, { status: 500 });
  }
}
