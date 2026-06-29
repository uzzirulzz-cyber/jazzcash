import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/seed-vip-account — creates the VIP account
// (private@playbeat.live / Private112233) with VIP status + 1-year subscription.
// Idempotent: if the account already exists, just ensures VIP is true.
export async function GET() {
  const email = 'private@playbeat.live';
  const password = 'Private112233';
  const name = 'VIP Member';

  try {
    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      // Ensure VIP is true + extend expiry.
      const updated = await db.user.update({
        where: { id: existing.id },
        data: {
          vip: true,
          vipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year
          password: existing.password ?? hashPassword(password), // set password if missing
        },
      });
      return NextResponse.json({
        ok: true,
        message: 'VIP account already existed — VIP status ensured',
        user: { id: updated.id, email: updated.email, name: updated.name, vip: updated.vip, vipExpiresAt: updated.vipExpiresAt },
      });
    }

    // Create the VIP account fresh.
    const user = await db.user.create({
      data: {
        cookie: `vip_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        email,
        name,
        password: hashPassword(password),
        role: 'viewer',
        vip: true,
        vipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'VIP account created successfully',
      user: { id: user.id, email: user.email, name: user.name, vip: user.vip, vipExpiresAt: user.vipExpiresAt },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
