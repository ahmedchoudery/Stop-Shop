import { withRoute, ApiError } from '@/lib/api/withRoute';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Customer from '@/models/Customer';
import { CUSTOMER_JWT_SECRET } from '@/lib/adminAuth';
import { createCustomerSchema } from '@/schemas/validation';
import { sendWelcomeEmail } from '@/services/emailService';
import { NextResponse } from 'next/server';

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: createCustomerSchema
  },
  handler: async ({ body }) => {
    const { name, email, password, phone } = body;

    const exists = await Customer.findOne({ email }).lean();
    if (exists) {
      throw new ApiError('CONFLICT', 'An account with this email already exists', 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    const customer = await Customer.create({
      name,
      email,
      password: hashed,
      phone: phone || '',
    });

    const token = jwt.sign(
      { id: customer._id.toString(), email: customer.email, type: 'customer' },
      CUSTOMER_JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safeCustomer = customer.toObject();
    delete safeCustomer.password;
    if (safeCustomer._id) {
      safeCustomer._id = safeCustomer._id.toString();
    }

    try {
      sendWelcomeEmail(customer);
    } catch (err) {
      console.error('[WelcomeEmail] Failed to initiate email dispatch:', err.message);
    }

    return NextResponse.json({ token, customer: safeCustomer }, { status: 201 });
  }
});
