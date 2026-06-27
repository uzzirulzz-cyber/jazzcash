import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toChannelDTO } from '@/lib/dto';
import { getCurrentUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

// GET /api/favorites — current user's favorites
export async function GET() {
  const user = await getCurrentUser();
  const favs = await db.favorite.findMany({
    where: { userId: user.id },
    include: { channel: { include: { playlist: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({
    favorites: favs.map((f) => toChannelDTO(f.channel, true)),
  });
}

// POST /api/favorites — add a favorite
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const channelId = String(body.channelId ?? '');
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 });
  const user = await getCurrentUser();
  try {
    await db.favorite.create({ data: { userId: user.id, channelId } });
  } catch {
    // already exists — ignore
  }
  return NextResponse.json({ ok: true });
}
