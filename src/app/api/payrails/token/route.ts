import { NextResponse } from 'next/server';
import { getPayrailsToken, isPayrailsConfigured, getPayrailsEnv } from '@/lib/payrails';

export const dynamic = 'force-dynamic';

// GET /api/payrails/token — returns a Payrails access token for client-side
// payment flows (e.g. DropIn SDK).
//
// The token is short-lived (default 3600s). The frontend should cache it
// client-side and request a new one when it expires.
//
// Returns 503 if Payrails is not configured (missing env vars).
export async function GET() {
  if (!isPayrailsConfigured()) {
    return NextResponse.json(
      {
        error: 'Payrails not configured. Set PAYRAILS_API_KEY and PAYRAILS_CLIENT_ID in .env',
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const token = await getPayrailsToken();
    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      environment: getPayrailsEnv(),
      configured: true,
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json(
      { error: err.message || 'Failed to get Payrails token', configured: true },
      { status: 500 },
    );
  }
}
