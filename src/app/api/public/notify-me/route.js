import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Product from '../../../../models/Product';
import ProductNotification from '../../../../models/ProductNotification';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, productId, selectedSize, selectedColor } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    if (!productId?.trim()) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const productExists = await Product.exists({ id: productId });
    if (!productExists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    try {
      await ProductNotification.create({
        email: email.trim().toLowerCase(),
        productId: productId.trim(),
        selectedSize: selectedSize?.trim() || '',
        selectedColor: selectedColor?.trim() || '',
        notified: false,
      });

      return NextResponse.json({
        message: 'Notification request saved. We will email you when it is back in stock.',
      }, { status: 201 });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return NextResponse.json({
          message: 'You are already on the notification list for this item.',
        }, { status: 200 });
      }
      throw dbErr;
    }
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to register notification request' }, { status: 500 });
  }
}
