import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Customer from '../../../../models/Customer';
import { CUSTOMER_JWT_SECRET } from '../../../../middleware/auth';
import { createCustomerSchema } from '../../../../schemas/validation';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = createCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { name, email, password, phone } = validation.data;

    const exists = await Customer.findOne({ email }).lean();
    if (exists) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
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

    return NextResponse.json({ token, customer: safeCustomer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
