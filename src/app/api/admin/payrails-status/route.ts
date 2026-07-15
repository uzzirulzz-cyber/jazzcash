import { NextResponse } from 'next/server';
import { isPayrailsConfigured, getPayrailsEnv, getPayrailsToken } from '@/lib/payrails';

export const dynamic = 'force-dynamic';

// GET /api/admin/payrails-status — check if Payrails is configured + test token
export async function GET() {
  const configured = isPayrailsConfigured();
  const env = getPayrailsEnv();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      environment: env,
      message: 'Payrails not configured. Add PAYRAILS_API_KEY + PAYRAILS_CLIENT_ID to .env',
    });
  }

  try {
    const token = await getPayrailsToken();
    // Don't return the full token — just confirm it works + show first 20 chars
    return NextResponse.json({
      configured: true,
      environment: env,
      tokenWorking: true,
      tokenPreview: token.slice(0, 20) + '...',
      message: 'Payrails is configured and the access token was retrieved successfully',
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json({
      configured: true,
      environment: env,
      tokenWorking: false,
      error: err.message || 'Failed to retrieve token',
    }, { status: 500 });
  }
}
