import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

// DELETE /api/favorites/[channelId]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const user = await getCurrentUser();
  await db.favorite.deleteMany({ where: { userId: user.id, channelId } });
  return NextResponse.json({ ok: true });
}
