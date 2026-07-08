import { withRoute, ApiError } from '@/lib/api/withRoute';
import Customer from '@/models/Customer';
import { z } from 'zod';

export const GET = withRoute({
  requiredRole: 'customer',
  handler: async ({ user }) => {
    const customer = await Customer.findById(user?.id).select('-password').lean();
    if (!customer) {
      throw new ApiError('NOT_FOUND', 'Account not found', 404);
    }

    if (customer._id) {
      customer._id = customer._id.toString();
    }

    return customer;
  }
});

export const PATCH = withRoute({
  requiredRole: 'customer',
  schema: {
    body: z.object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      zip: z.string().optional(),
    })
  },
  handler: async ({ body, user }) => {
    const { name, phone, address, city, zip } = body;

    const updates = {};
    if (name?.trim() && name.trim().length >= 2) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() ?? '';
    if (address !== undefined) updates.address = address?.trim() ?? '';
    if (city !== undefined) updates.city = city?.trim() ?? '';
    if (zip !== undefined) updates.zip = zip?.trim() ?? '';

    const customer = await Customer
      .findByIdAndUpdate(user?.id, updates, { new: true })
      .select('-password')
      .lean();

    if (!customer) {
      throw new ApiError('NOT_FOUND', 'Account not found', 404);
    }

    if (customer._id) {
      customer._id = customer._id.toString();
    }

    return customer;
  }
});
