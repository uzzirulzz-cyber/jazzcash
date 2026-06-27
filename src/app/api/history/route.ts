import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toChannelDTO } from '@/lib/dto';
import { getCurrentUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

// GET /api/history — current user's watch history
export async function GET() {
  const user = await getCurrentUser();
  const items = await db.watchHistory.findMany({
    where: { userId: user.id },
    include: { channel: { include: { playlist: true } } },
    orderBy: { watchedAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({
    history: items
      .filter((h) => h.channel)
      .map((h) => ({
        ...toChannelDTO(h.channel, true),
        position: h.position,
        duration: h.duration,
        watchedAt: h.watchedAt.toISOString(),
      })),
  });
}

// POST /api/history — record a watch event (and update continue-watching)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const channelId = String(body.channelId ?? '');
  const position = Number(body.position) || 0;
  const duration = Number(body.duration) || 0;
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 });
  const user = await getCurrentUser();

  await db.watchHistory.create({
    data: { userId: user.id, channelId, position, duration },
  });

  await db.continueWatching.upsert({
    where: { userId_channelId: { userId: user.id, channelId } },
    create: { userId: user.id, channelId, position },
    update: { position },
  });

  return NextResponse.json({ ok: true });
}
