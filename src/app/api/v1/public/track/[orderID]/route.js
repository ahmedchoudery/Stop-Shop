import { withRoute, ApiError } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { z } from 'zod';

export const GET = withRoute({
  requiredRole: 'public',
  schema: {
    params: z.object({
      orderID: z.string().min(1)
    })
  },
  handler: async ({ params }) => {
    const { orderID } = params;

    const orderDoc = await Order.findOne({ orderID: orderID.toUpperCase() }).lean();
    if (!orderDoc) {
      throw new ApiError('NOT_FOUND', 'Order not found', 404);
    }

    const itemIds = orderDoc.items.map(item => item.id);
    const dbProducts = await Product.find({ id: { $in: itemIds } })
      .select('id image')
      .lean();
    const imageMap = new Map(dbProducts.map(p => [p.id, p.image]));

    const formattedItems = orderDoc.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize || '',
      selectedColor: item.selectedColor || '',
      image: item.image || imageMap.get(item.id) || '',
    }));

    return {
      orderID:        orderDoc.orderID,
      status:         orderDoc.status,
      paymentMethod:  orderDoc.paymentMethod,
      paymentStatus:  orderDoc.paymentDetails?.status || 'Pending',
      total:          orderDoc.total,
      courier:        orderDoc.courier || '',
      trackingNumber: orderDoc.trackingNumber || '',
      items:          formattedItems,
      createdAt:      orderDoc.createdAt ? new Date(orderDoc.createdAt).toISOString() : null,
    };
  }
});
