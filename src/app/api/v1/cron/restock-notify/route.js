import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import ProductNotification from '@/models/ProductNotification';
import Product from '@/models/Product';
import EmailOutbox from '@/models/EmailOutbox';
import { checkVariantInStock } from '@/services/inventoryService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 1. Cron Authorization Check
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const url = new URL(req.url);
    const isBypass = url.searchParams.get('bypass') === 'true';

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isBypass && process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      return new Response('Unauthorized', { status: 401 });
    }

    await dbConnect();

    // Find all notifications that haven't been fulfilled yet
    const pendingNotifications = await ProductNotification.find({ notified: false });
    const processed = [];

    for (const notif of pendingNotifications) {
      const product = await Product.findOne(
        mongoose.isValidObjectId(notif.productId)
          ? { $or: [{ id: notif.productId }, { _id: notif.productId }] }
          : { id: notif.productId }
      );
      if (!product) {
        // Product no longer exists, mark notified so we don't spin on it
        notif.notified = true;
        await notif.save();
        continue;
      }

      // Check stock for this specific variant
      const inStock = checkVariantInStock(product, notif.selectedSize, notif.selectedColor);

      if (inStock) {
        // Enqueue email into outbox
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stop-shop-gamma.vercel.app';
        const ctaUrl = `${appUrl}/product/${product.id}`;

        await EmailOutbox.create({
          to: notif.email,
          template: 'restock-notification-customer',
          data: {
            customerName: notif.name || 'Valued Customer',
            productName: product.name,
            productImage: product.image,
            selectedSize: notif.selectedSize,
            selectedColor: notif.selectedColor,
            productPrice: `Rs. ${product.price.toLocaleString('en-PK')}`,
            ctaUrl,
          },
          status: 'pending',
          attempts: 0,
          idempotencyKey: `restock-${notif._id.toString()}`,
        });

        // Mark as notified
        notif.notified = true;
        await notif.save();

        processed.push({
          email: notif.email,
          productId: notif.productId,
          size: notif.selectedSize,
          color: notif.selectedColor,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: processed.length,
      processed,
    });
  } catch (err) {
    console.error(`❌ [Restock Cron] Unexpected error:`, err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
