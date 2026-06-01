import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Review from '../../../../models/Review';
import Product from '../../../../models/Product';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    const filter = { status: 'approved' };
    if (productId) {
      filter.productId = String(productId);
    }

    const reviews = await Review.find(filter)
      .select('customerName rating title body createdAt productId')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const data = reviews.map(r => ({
      ...r,
      _id: r._id?.toString() || null,
      productId: r.productId || null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, rating, title, body: reviewText, productId } = body;

    if (productId) {
      const p = await Product.exists({ id: productId });
      if (!p) {
        return NextResponse.json({ error: 'Referenced product not found' }, { status: 404 });
      }
    }

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    if (!title?.trim()) return NextResponse.json({ error: 'Review title is required' }, { status: 400 });
    if (!reviewText?.trim()) return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    if (reviewText.trim().length < 20) {
      return NextResponse.json({ error: 'Review must be at least 20 characters' }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const review = await Review.create({
      customerName: name.trim(),
      customerEmail: email.trim().toLowerCase(),
      rating: parseInt(rating),
      title: title.trim(),
      body: reviewText.trim(),
      productId: productId ?? '',
      status: 'pending',
    });

    return NextResponse.json({
      message: 'Review submitted successfully. It will appear after moderation.',
      id: review._id?.toString(),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
