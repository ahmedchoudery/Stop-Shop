import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Settings from '../../../../models/Settings';

export async function GET() {
  try {
    await dbConnect();
    const settings = await Settings.findOne().lean();
    const data = settings ?? { announcement: 'Welcome to Stop & Shop - E2E Test Store', logo: '' };

    if (data._id) {
      data._id = data._id.toString();
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ announcement: 'Welcome to Stop & Shop - E2E Test Store', logo: '' });
  }
}
