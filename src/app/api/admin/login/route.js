import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Admin from '../../../../models/Admin';
import { JWT_SECRET } from '../../../../lib/adminAuth';
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

    // We need '+password' because select: false is set on the model
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const minutes = Math.ceil((admin.lockUntil - Date.now()) / 60_000);
      return NextResponse.json({ error: `Account locked. Try again in ${minutes} minutes.` }, { status: 423 });
    }

    const passwordValid = await bcrypt.compare(password, admin.password);
    if (!passwordValid) {
      const attempts = admin.failedLoginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
      await Admin.findByIdAndUpdate(admin._id, { $inc: { failedLoginAttempts: 1 }, ...(lockUntil && { lockUntil }) });

      if (lockUntil) {
        return NextResponse.json({ error: 'Too many failed attempts. Account locked for 15 minutes.' }, { status: 423 });
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Reset failed login attempts and update lastLogin
    await Admin.findByIdAndUpdate(admin._id, { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() });

    const token = jwt.sign(
      { id: admin._id.toString(), email: admin.email, role: admin.roles?.[0] ?? 'admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const csrfToken = jwt.sign(
      { type: 'csrf', userId: admin._id.toString() },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = NextResponse.json({ name: admin.name, success: true, token });

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    };

    response.cookies.set('auth_token', token, { ...cookieOptions, maxAge: 8 * 60 * 60 });
    response.cookies.set('csrf_token', csrfToken, { ...cookieOptions, maxAge: 60 * 60 });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
