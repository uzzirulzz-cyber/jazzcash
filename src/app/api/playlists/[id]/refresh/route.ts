import { NextRequest, NextResponse } from 'next/server';
import { importPlaylist } from '@/lib/import-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/playlists/[id]/refresh — trigger a manual refresh
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await importPlaylist(id);
  return NextResponse.json({ result });
}
