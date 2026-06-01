import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Product from '../../../../models/Product';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch products directly on the server
    const products = await Product.find().lean();
    
    const data = products.map(p => ({
      ...p,
      _id: p._id?.toString(),
      id: p.id || p._id?.toString(),
      bucket: p.bucket || 'Tops',
      subCategory: p.subCategory || 'Tshirt',
    }));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
