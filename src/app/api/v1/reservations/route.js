import { withRoute, ApiError } from '@/lib/api/withRoute';
import { createReservation, removeReservation } from '@/services/reservationService';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const reservationSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  color:     z.string().optional().default(''),
  size:      z.string().optional().default(''),
  qty:       z.number().int().min(1, 'Quantity must be at least 1').optional().default(1),
  userId:    z.string().min(1, 'User ID is required'),
});

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: reservationSchema
  },
  handler: async ({ body }) => {
    try {
      const reservation = await createReservation({
        productId: body.productId,
        color:     body.color,
        size:      body.size,
        qty:       body.qty,
        userId:    body.userId
      });
      return NextResponse.json({ message: 'Reservation created successfully', reservation }, { status: 201 });
    } catch (err) {
      if (err.message === 'OUT_OF_STOCK') {
        throw new ApiError('CONFLICT', 'Variant is out of stock', 409);
      }
      throw new ApiError('VALIDATION', err.message, 400);
    }
  }
});

export const DELETE = withRoute({
  requiredRole: 'public',
  schema: {
    body: reservationSchema
  },
  handler: async ({ body }) => {
    try {
      const result = await removeReservation({
        productId: body.productId,
        color:     body.color,
        size:      body.size,
        qty:       body.qty,
        userId:    body.userId
      });
      return NextResponse.json({ message: 'Reservation removed successfully', result }, { status: 200 });
    } catch (err) {
      throw new ApiError('VALIDATION', err.message, 400);
    }
  }
});
