import { withRoute, ApiError } from '@/lib/api/withRoute';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import { z } from 'zod';

export const GET = withRoute({
  requiredRole: 'customer',
  handler: async ({ user }) => {
    const customer = await Customer.findById(user?.id).lean();
    if (!customer) {
      throw new ApiError('NOT_FOUND', 'Customer account not found', 404);
    }
    const wishlistIds = customer.wishlist || [];
    const products = await Product.find({ id: { $in: wishlistIds } }).lean();
    return products.map(p => {
      if (p._id) p._id = p._id.toString();
      return p;
    });
  }
});

export const POST = withRoute({
  requiredRole: 'customer',
  schema: {
    body: z.object({
      productId: z.string({ required_error: 'Product ID is required' }).min(1),
    })
  },
  handler: async ({ body, user }) => {
    const { productId } = body;
    const customer = await Customer.findById(user?.id);
    if (!customer) {
      throw new ApiError('NOT_FOUND', 'Customer account not found', 404);
    }

    const index = customer.wishlist.indexOf(productId);
    if (index > -1) {
      customer.wishlist.splice(index, 1);
    } else {
      customer.wishlist.push(productId);
    }

    await customer.save();
    
    // Return full updated products array
    const products = await Product.find({ id: { $in: customer.wishlist } }).lean();
    return products.map(p => {
      if (p._id) p._id = p._id.toString();
      return p;
    });
  }
});
