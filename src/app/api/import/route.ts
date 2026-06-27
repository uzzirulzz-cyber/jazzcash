import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importPlaylist } from '@/lib/import-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/import — refresh all enabled playlists
export async function POST() {
  const playlists = await db.playlist.findMany({ where: { enabled: true } });
  const results = await Promise.allSettled(
    playlists.map((p) => importPlaylist(p.id)),
  );
  return NextResponse.json({
    results: results.map((r, i) => ({
      playlistId: playlists[i].id,
      name: playlists[i].name,
      status: r.status,
      result: r.status === 'fulfilled' ? r.value : String(r.reason),
    })),
  });
}
