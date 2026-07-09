import { withRoute } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { z } from 'zod';
import { POST as checkoutPOST } from '../checkout/route.js';

export const POST = checkoutPOST;

export const GET = withRoute({
  requiredRole: 'staff',
  schema: {
    query: z.object({
      page: z.string().transform(val => Math.max(1, parseInt(val, 10))).optional().default('1'),
      limit: z.string().transform(val => Math.max(1, Math.min(100, parseInt(val, 10)))).optional().default('100'),
    })
  },
  handler: async ({ query }) => {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const totalCount = await Order.countDocuments({});
    const orders = await Order.find({})
      .select('orderID customer total status paymentMethod paymentDetails items createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const allProductIds = [...new Set(orders.flatMap(o => (o.items || []).map(i => i.id)))];
    const dbProducts = await Product.find({ id: { $in: allProductIds } })
      .select('id image')
      .lean();
    const productImageMap = new Map(dbProducts.map(p => [p.id, p.image]));

    const formatted = orders.map((order) => ({
      ...order,
      _id: order._id?.toString() || null,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
      items: (order.items || []).map((item) => ({
        ...item,
        image: item.image || productImageMap.get(item.id) || '',
      })),
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Total-Count': totalCount.toString(),
        'X-Total-Pages': Math.ceil(totalCount / limit).toString(),
        'X-Current-Page': page.toString(),
        'X-Limit': limit.toString(),
      }
    });
  }
});

