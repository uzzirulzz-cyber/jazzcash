import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, hashPassword, upgradeAnonymousUser, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/signup — register a new user
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim();
  const password = String(body.password ?? '');

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Check if email is already taken.
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const session = await getSessionUser();
  const hashed = hashPassword(password);

  // Upgrade the anonymous session user to a registered user.
  await upgradeAnonymousUser(session.id, email, name, hashed);
  await setSessionCookie(session.cookie);

  return NextResponse.json({
    user: { id: session.id, email, name, role: 'viewer', vip: false, vipExpiresAt: null },
  });
}
