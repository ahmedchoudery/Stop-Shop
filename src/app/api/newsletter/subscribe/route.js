import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Subscriber from '../../../../models/Subscriber';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const trimmed = email.toLowerCase().trim();
    await Subscriber.findOneAndUpdate({ email: trimmed }, { email: trimmed }, { upsert: true });
    return NextResponse.json({ message: 'Subscribed! Use code CARDINAL20 for 20% off your first order.' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
