import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/auth/me — return the current authenticated user (or null)
export async function GET() {
  const session = await getSessionUser();
  return NextResponse.json({
    user: session.email
      ? { id: session.id, email: session.email, name: session.name, role: session.role, vip: session.vip, vipExpiresAt: session.vipExpiresAt }
      : null,
  });
}
