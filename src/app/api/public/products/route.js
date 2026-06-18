import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Product from '../../../../models/Product';

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '100', 10))); // High default to avoid breaking existing pages that need all items
    const skip = (page - 1) * limit;

    const query = { featuredSection: { $ne: 'attitude' } };
    const totalCount = await Product.countDocuments(query);
    
    // Fetch products directly on the server with projection
    const products = await Product.find(query)
      .select('id name price discount image colors sizes bucket subCategory featuredSection quantity isNew displayOrder sectionName')
      .skip(skip)
      .limit(limit)
      .lean();
    
    const data = products.map(p => ({
      ...p,
      _id: p._id?.toString(),
      id: p.id || p._id?.toString(),
      bucket: p.bucket || 'Tops',
      subCategory: p.subCategory || 'Tshirt',
    }));

    return NextResponse.json(data, {
      headers: {
        'X-Total-Count': totalCount.toString(),
        'X-Total-Pages': Math.ceil(totalCount / limit).toString(),
        'X-Current-Page': page.toString(),
        'X-Limit': limit.toString(),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
