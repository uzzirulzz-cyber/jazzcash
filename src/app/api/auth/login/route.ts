import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { findUserByEmail, verifyPassword, setSessionCookie, getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/login — authenticate with email + password
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !user.password) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  if (!verifyPassword(password, user.password)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Set the session cookie to this user's cookie.
  await setSessionCookie(user.cookie);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, vip: user.vip, vipExpiresAt: user.vipExpiresAt },
  });
}
