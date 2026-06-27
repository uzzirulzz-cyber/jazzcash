import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { probeStream } from '@/lib/import-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// POST /api/channels/[id]/probe — check stream health
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await db.channel.findUnique({ where: { id } });
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const status = await probeStream(channel.url);
  await db.channel.update({
    where: { id },
    data: { status },
  });
  // update playlist online/offline counts
  const agg = await db.channel.groupBy({
    by: ['status'],
    where: { sourceId: channel.sourceId },
    _count: true,
  });
  const online = agg.find((a) => a.status === 'online')?._count ?? 0;
  const offline = agg.find((a) => a.status === 'offline')?._count ?? 0;
  await db.playlist.update({
    where: { id: channel.sourceId },
    data: { onlineCount: online, offlineCount: offline },
  });
  return NextResponse.json({ status });
}
