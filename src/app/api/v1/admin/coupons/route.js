import { withRoute, ApiError } from '@/lib/api/withRoute';
import Coupon from '@/models/Coupon';
import { withAudit } from '@/lib/audit';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withRoute({
  requiredRole: 'admin',
  handler: async () => {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return coupons.map((c) => ({
      ...c,
      _id: c._id?.toString() || null,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
    }));
  }
});

export const POST = withRoute({
  requiredRole: 'admin',
  schema: {
    body: z.object({
      code: z.string().min(1),
      type: z.enum(['percentage', 'fixed']).optional().default('percentage'),
      value: z.number().or(z.string().transform(v => parseFloat(v))),
      minOrderValue: z.number().or(z.string().transform(v => parseFloat(v))).optional().default(0),
      maxUses: z.number().nullable().or(z.string().transform(v => v ? parseInt(v) : null)).optional().default(null),
      expiresAt: z.string().nullable().or(z.date()).optional().default(null),
    })
  },
  handler: async ({ req, body }) => {
    const couponData = {
      code:          body.code.trim().toUpperCase(),
      type:          body.type,
      value:         body.value,
      minOrderValue: body.minOrderValue,
      maxUses:       body.maxUses,
      expiresAt:     body.expiresAt ? new Date(body.expiresAt) : null,
      isActive:      true,
    };

    try {
      const coupon = await withAudit(
        'COUPON_CREATE',
        couponData.code,
        req,
        null,
        couponData,
        async (session) => {
          const created = await Coupon.create([couponData], { session });
          return created[0];
        }
      );

      const formatted = coupon.toObject ? coupon.toObject() : coupon;
      if (formatted._id) {
        formatted._id = formatted._id.toString();
      }

      return NextResponse.json(formatted, { status: 201 });
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError('CONFLICT', 'Coupon code already exists', 409);
      }
      throw error;
    }
  }
});
