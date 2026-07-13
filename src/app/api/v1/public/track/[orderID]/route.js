import { withRoute, ApiError } from '@/lib/api/withRoute';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { z } from 'zod';

export const GET = withRoute({
  requiredRole: 'public',
  schema: {
    params: z.object({
      orderID: z.string().trim().min(1, 'Order ID required')
    }),
    query: z.object({
      email: z.string().trim().email('Invalid email address').optional()
    })
  },
  handler: async ({ params, query }) => {
    const { orderID } = params;
    const { email } = query;

    const upperId = orderID.toUpperCase();
    if (!upperId.startsWith('ORD-') && !upperId.startsWith('STOP-')) {
      throw new ApiError('VALIDATION', 'Invalid order ID format. Must start with ORD- or STOP-', 400);
    }

    if (!email) {
      throw new ApiError('VALIDATION', 'Email address is required for verification', 400);
    }

    const orderDoc = await Order.findOne({ orderID: orderID.toUpperCase() }).lean();
    if (!orderDoc || !orderDoc.customer || orderDoc.customer.email.toLowerCase() !== email.toLowerCase()) {
      throw new ApiError('NOT_FOUND', 'Order not found or verification failed', 404);
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
      quantity: item.quantity ?? 1,
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
      updatedAt:      orderDoc.updatedAt ? new Date(orderDoc.updatedAt).toISOString() : null,
      customer: {
        name:    orderDoc.customer.name || '',
        address: orderDoc.customer.address || '',
        city:    orderDoc.customer.city || '',
        zip:     orderDoc.customer.zip || '',
      }
    };
  }
});
