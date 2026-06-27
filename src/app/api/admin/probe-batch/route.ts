import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { testStreamUrl } from '@/app/api/channels/[id]/stream-test/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/admin/probe-batch — test a batch of channels and update their status
// Body: { limit?: number, category?: string, featuredOnly?: boolean }
// Returns summary of working vs broken channels.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit) || 50, 200);
  const category = body.category;
  const featuredOnly = body.featuredOnly === true;

  // Fetch channels to test — prioritize featured/trending first
  const where: Record<string, unknown> = { enabled: true };
  if (category) where.category = category;
  if (featuredOnly) where.featured = true;

  const channels = await db.channel.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { trending: 'desc' }, { viewCount: 'desc' }],
    take: limit,
    select: { id: true, url: true, name: true },
  });

  let working = 0;
  let broken = 0;
  const results: { id: string; name: string; playable: boolean; reason: string }[] = [];

  // Test in parallel (batch of 10 at a time to avoid overwhelming)
  const batchSize = 10;
  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (ch) => {
        const result = await testStreamUrl(ch.url);
        // Update channel status in DB
        await db.channel.update({
          where: { id: ch.id },
          data: {
            status: result.playable ? 'online' : 'offline',
          },
        });
        return { id: ch.id, name: ch.name, playable: result.playable, reason: result.reason };
      }),
    );
    for (const r of batchResults) {
      results.push(r);
      if (r.playable) working++;
      else broken++;
    }
  }

  // Update playlist online/offline counts
  const playlists = await db.playlist.findMany({ select: { id: true } });
  for (const p of playlists) {
    const [online, total] = await Promise.all([
      db.channel.count({ where: { sourceId: p.id, status: 'online', enabled: true } }),
      db.channel.count({ where: { sourceId: p.id, enabled: true } }),
    ]);
    await db.playlist.update({
      where: { id: p.id },
      data: { onlineCount: online, offlineCount: total - online },
    });
  }

  return NextResponse.json({
    tested: channels.length,
    working,
    broken,
    results: results.slice(0, 20), // return first 20 for the UI
  });
}
