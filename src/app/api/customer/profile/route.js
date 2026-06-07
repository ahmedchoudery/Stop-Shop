import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Customer from '../../../../models/Customer';
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

    const customer = await Customer.findById(customerPayload.id).select('-password').lean();
    if (!customer) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (customer._id) {
      customer._id = customer._id.toString();
    }

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();
    const customerPayload = getCustomerFromToken(req);
    if (!customerPayload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, address, city, zip } = body;

    const updates = {};
    if (name?.trim() && name.trim().length >= 2) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() ?? '';
    if (address !== undefined) updates.address = address?.trim() ?? '';
    if (city !== undefined) updates.city = city?.trim() ?? '';
    if (zip !== undefined) updates.zip = zip?.trim() ?? '';

    const customer = await Customer
      .findByIdAndUpdate(customerPayload.id, updates, { new: true })
      .select('-password')
      .lean();

    if (!customer) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (customer._id) {
      customer._id = customer._id.toString();
    }

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
