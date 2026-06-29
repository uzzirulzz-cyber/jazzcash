import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/vip/subscribe — mock VIP subscription purchase ($8/month)
// Marks the current user as VIP for 30 days. In production this would integrate
// with Stripe/PayPal after payment confirmation.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = body.plan || 'monthly'; // monthly | yearly
    const durationDays = plan === 'yearly' ? 365 : 30;

    const session = await getSessionUser();
    if (!session.email) {
      return NextResponse.json({ error: 'Please log in or create an account first' }, { status: 401 });
    }

    // Upgrade the user to VIP.
    const updated = await db.user.update({
      where: { id: session.id },
      data: {
        vip: true,
        vipExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      ok: true,
      message: `VIP subscription active! ${plan === 'yearly' ? '1 year' : '30 days'} of premium access.`,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        vip: updated.vip,
        vipExpiresAt: updated.vipExpiresAt,
      },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
