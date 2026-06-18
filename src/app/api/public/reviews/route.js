import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Review from '../../../../models/Review';
import Product from '../../../../models/Product';
import Order from '../../../../models/Order';

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
      .select('customerName rating title body createdAt productId productName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const data = reviews.map(r => ({
      ...r,
      name: r.customerName || '',
      _id: r._id?.toString() || null,
      productId: r.productId || null,
      productName: r.productName || null,
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
    const { name, email, rating, title, body: reviewText, productId, productName } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    if (!reviewText?.trim()) return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    if (reviewText.trim().length < 20) {
      return NextResponse.json({ error: 'Review must be at least 20 characters' }, { status: 400 });
    }

    const ratingValue = rating !== undefined ? parseInt(rating, 10) : 5;
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const titleValue = title?.trim() || '';

    if (productId) {
      const p = await Product.exists({ id: productId });
      if (!p) {
        return NextResponse.json({ error: 'Referenced product not found' }, { status: 404 });
      }

      // Check if there is an order with this email containing the productId,
      // where either the order status or payment status is 'Paid' or 'Delivered'.
      const verifiedPurchase = await Order.exists({
        'customer.email': email.trim().toLowerCase(),
        $or: [
          { status: 'Paid' },
          { status: 'Delivered' },
          { 'paymentDetails.status': 'Paid' }
        ],
        'items.id': productId
      });

      if (!verifiedPurchase) {
        return NextResponse.json({
          error: 'Only customers who have purchased this product can leave a review.'
        }, { status: 403 });
      }
    }

    const review = await Review.create({
      customerName: name.trim(),
      customerEmail: email.trim().toLowerCase(),
      rating: ratingValue,
      title: titleValue,
      body: reviewText.trim(),
      productId: productId ?? '',
      productName: productName?.trim() || '',
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
