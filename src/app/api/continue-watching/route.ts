import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toChannelDTO } from '@/lib/dto';
import { getCurrentUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

// GET /api/continue-watching — resume list
export async function GET() {
  const user = await getCurrentUser();
  const items = await db.continueWatching.findMany({
    where: { userId: user.id },
    include: { channel: { include: { playlist: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({
    items: items
      .filter((i) => i.channel)
      .map((i) => ({
        ...toChannelDTO(i.channel, true),
        position: i.position,
        updatedAt: i.updatedAt.toISOString(),
      })),
  });
}
