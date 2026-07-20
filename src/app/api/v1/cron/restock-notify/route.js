import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ProductNotification from '@/models/ProductNotification';
import Product from '@/models/Product';
import EmailOutbox from '@/models/EmailOutbox';

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
      const product = await Product.findOne({ id: notif.productId });
      if (!product) {
        // Product no longer exists, mark notified so we don't spin on it
        notif.notified = true;
        await notif.save();
        continue;
      }

      // Check stock for this specific variant
      let inStock = false;
      const sizeStockObj = product.sizeStock
        ? (product.sizeStock instanceof Map ? Object.fromEntries(product.sizeStock) : product.sizeStock)
        : null;
      const colorStockObj = product.colorStock
        ? (product.colorStock instanceof Map ? Object.fromEntries(product.colorStock) : product.colorStock)
        : null;
      const variantMatrixObj = product.variantMatrix
        ? (product.variantMatrix instanceof Map ? Object.fromEntries(product.variantMatrix) : product.variantMatrix)
        : null;

      const hasMatrix = variantMatrixObj && Object.keys(variantMatrixObj).length > 0;
      const hasSizes = sizeStockObj && Object.keys(sizeStockObj).length > 0;
      const hasColors = colorStockObj && Object.keys(colorStockObj).length > 0;

      if (hasMatrix && notif.selectedColor && notif.selectedSize) {
        const qty = variantMatrixObj[`${notif.selectedColor}|${notif.selectedSize}`] ?? 0;
        inStock = qty > 0;
      } else if (hasSizes && notif.selectedSize) {
        const qty = sizeStockObj[notif.selectedSize] ?? 0;
        inStock = qty > 0;
      } else if (hasColors && notif.selectedColor) {
        const qty = colorStockObj[notif.selectedColor] ?? 0;
        inStock = qty > 0;
      } else {
        inStock = (product.quantity ?? 0) > 0;
      }

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
