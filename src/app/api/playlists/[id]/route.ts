import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toPlaylistDTO } from '@/lib/dto';
import { importPlaylist } from '@/lib/import-service';

export const dynamic = 'force-dynamic';

// PATCH /api/playlists/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') data.name = body.name.trim();
  if (typeof body.url === 'string') {
    if (!/^https?:\/\//i.test(body.url)) {
      return NextResponse.json({ error: 'url must start with http(s)://' }, { status: 400 });
    }
    data.url = body.url.trim();
  }
  if (typeof body.refreshHours === 'number') data.refreshHours = body.refreshHours;
  if (typeof body.enabled === 'boolean') data.enabled = body.enabled;

  const playlist = await db.playlist.update({ where: { id }, data });
  return NextResponse.json({ playlist: toPlaylistDTO(playlist) });
}

// DELETE /api/playlists/[id] — removes playlist + its channels
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.playlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
