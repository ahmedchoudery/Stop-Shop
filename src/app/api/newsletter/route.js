import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Subscriber from '../../../models/Subscriber';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email } = body;
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    await Subscriber.findOneAndUpdate({ email }, { email }, { upsert: true });
    return NextResponse.json({ message: 'Subscribed successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
