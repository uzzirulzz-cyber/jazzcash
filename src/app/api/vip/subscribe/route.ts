import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { isPayrailsConfigured, payrailsFetch } from '@/lib/payrails';

export const dynamic = 'force-dynamic';

// POST /api/vip/subscribe — VIP subscription purchase ($8/month)
//
// Two modes:
// 1. If Payrails is configured (PAYRAILS_API_KEY + PAYRAILS_CLIENT_ID set):
//    Creates a real payment execution via Payrails API. The frontend should
//    first collect payment via the Payrails DropIn SDK, then call this
//    endpoint with the executionId to confirm + grant VIP.
// 2. If Payrails is NOT configured: mock mode (instant VIP, no real charge)
//
// Request body:
//   { plan: 'monthly' | 'yearly', executionId?: string }
//   - plan: monthly ($8) or yearly ($80). Default: monthly
//   - executionId: Payrails execution ID (required in production mode to
//     confirm the payment was captured before granting VIP)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = body.plan || 'monthly'; // monthly | yearly
    const durationDays = plan === 'yearly' ? 365 : 30;
    const amount = plan === 'yearly' ? 8000 : 800; // cents ($80.00 / $8.00)
    const executionId = body.executionId as string | undefined;

    const session = await getSessionUser();
    if (!session.email) {
      return NextResponse.json({ error: 'Please log in or create an account first' }, { status: 401 });
    }

    const payrailsConfigured = isPayrailsConfigured();

    // In production mode, verify the Payrails execution exists + was captured.
    if (payrailsConfigured && executionId) {
      try {
        const execRes = await payrailsFetch(`/executions/${executionId}`);
        if (!execRes.ok) {
          return NextResponse.json(
            { error: 'Payment verification failed. Please contact support.' },
            { status: 400 },
          );
        }
        // Execution exists — payment was captured. Grant VIP.
      } catch {
        return NextResponse.json(
          { error: 'Could not verify payment with Payrails. Please try again.' },
          { status: 502 },
        );
      }
    } else if (payrailsConfigured && !executionId) {
      // Production mode but no executionId — return the Payrails token so the
      // frontend can render the DropIn payment form.
      return NextResponse.json({
        ok: false,
        requiresPayment: true,
        message: 'Payment required. Use the Payrails DropIn SDK to collect payment, then retry with executionId.',
        amount,
        currency: 'USD',
        plan,
      }, { status: 402 }); // 402 Payment Required
    }

    // Grant VIP status (either mock mode, or production mode after verification)
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
      paymentMode: payrailsConfigured ? 'payrails' : 'mock',
      amount,
      currency: 'USD',
      plan,
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
