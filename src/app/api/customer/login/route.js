import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Customer from '../../../../models/Customer';
import { CUSTOMER_JWT_SECRET } from '../../../../middleware/auth';
import { loginSchema } from '../../../../schemas/validation';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate request
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { email, password } = validation.data;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

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

    return NextResponse.json({ token, customer: safeCustomer });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
