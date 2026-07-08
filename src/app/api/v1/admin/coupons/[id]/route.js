import { withRoute, ApiError } from '@/lib/api/withRoute';
import Coupon from '@/models/Coupon';
import { withAudit } from '@/lib/audit';
import { z } from 'zod';

export const PATCH = withRoute({
  requiredRole: 'admin',
  schema: {
    params: z.object({
      id: z.string().min(1)
    }),
    body: z.object({
      code: z.string().min(1).optional(),
      type: z.enum(['percentage', 'fixed']).optional(),
      value: z.number().optional(),
      minOrderValue: z.number().optional(),
      maxUses: z.number().nullable().optional(),
      expiresAt: z.string().nullable().or(z.date()).optional(),
      isActive: z.boolean().optional(),
    })
  },
  handler: async ({ req, body, params }) => {
    const { id } = params;

    const prevCoupon = await Coupon.findById(id).lean();
    if (!prevCoupon) {
      throw new ApiError('NOT_FOUND', 'Coupon not found', 404);
    }

    const updates = { ...body };
    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }
    if (updates.expiresAt) {
      updates.expiresAt = new Date(updates.expiresAt);
    }

    const coupon = await withAudit(
      'COUPON_UPDATE',
      id,
      req,
      prevCoupon,
      updates,
      async (session) => {
        return Coupon.findByIdAndUpdate(id, updates, { new: true, session }).lean();
      }
    );

    if (coupon._id) {
      coupon._id = coupon._id.toString();
    }

    return coupon;
  }
});

export const DELETE = withRoute({
  requiredRole: 'admin',
  schema: {
    params: z.object({
      id: z.string().min(1)
    })
  },
  handler: async ({ req, params }) => {
    const { id } = params;

    const prevCoupon = await Coupon.findById(id).lean();
    if (!prevCoupon) {
      throw new ApiError('NOT_FOUND', 'Coupon not found', 404);
    }

    await withAudit(
      'COUPON_DELETE',
      prevCoupon.code,
      req,
      prevCoupon,
      null,
      async (session) => {
        await Coupon.findByIdAndDelete(id, { session });
      }
    );

    return { message: 'Coupon deleted' };
  }
});
