import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Customer from '../../../../models/Customer';
import Order from '../../../../models/Order';
import { CUSTOMER_JWT_SECRET } from '../../../../lib/adminAuth';

function getCustomerFromToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, CUSTOMER_JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const customerPayload = getCustomerFromToken(req);
    if (!customerPayload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const customer = await Customer.findById(customerPayload.id).select('email').lean();
    if (!customer) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
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

    return NextResponse.json(formattedOrders);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
