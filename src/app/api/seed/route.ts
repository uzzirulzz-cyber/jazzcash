import { NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';

export const dynamic = 'force-dynamic';

// POST /api/seed — seed categories + default playlists
export async function POST() {
  await ensureSeeded();
  return NextResponse.json({ ok: true });
}
