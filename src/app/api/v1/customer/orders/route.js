import { withRoute, ApiError } from '@/lib/api/withRoute';
import Customer from '@/models/Customer';
import Order from '@/models/Order';

export const GET = withRoute({
  requiredRole: 'customer',
  handler: async ({ user }) => {
    // user is populated by withRoute for the customer
    const customer = await Customer.findById(user?.id).select('email').lean();
    if (!customer) {
      throw new ApiError('NOT_FOUND', 'Account not found', 404);
    }

    const orders = await Order
      .find({ 'customer.email': customer.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedOrders = orders.map(order => ({
      ...order,
      _id: order._id?.toString() || null,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
    }));

    return formattedOrders;
  }
});
