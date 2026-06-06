import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Settings from '../../../models/Settings';
import { requireAdmin } from '../../../lib/adminAuth';
import { updateSettingsSchema } from '../../../schemas/validation';
import { logAudit } from '../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../services/cacheService';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const s = await Settings.findOne().lean();
    const data = s ?? { announcement: 'Welcome to Stop & Shop', logo: '' };
    if (data._id) {
      data._id = data._id.toString();
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const settings = await Settings.findOneAndUpdate({}, validation.data, { new: true, upsert: true }).lean();
    await logAudit('SETTINGS_UPDATE', { changed: Object.keys(validation.data) }, adminPayload.email, req);
    await cacheService.del(CACHE_KEYS.SETTINGS);

    if (settings._id) {
      settings._id = settings._id.toString();
    }

    return NextResponse.json({ message: 'Settings updated', settings });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
