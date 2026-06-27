import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toChannelDTO } from '@/lib/dto';
import { getCurrentUser } from '@/lib/user';
import { categorizeChannel } from '@/lib/categorize';

export const dynamic = 'force-dynamic';

// GET /api/channels/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const fav = await db.favorite.findUnique({
    where: { userId_channelId: { userId: user.id, channelId: id } },
  });
  const channel = await db.channel.findUnique({
    where: { id },
    include: { playlist: true },
  });
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ channel: toChannelDTO(channel, !!fav) });
}

// PATCH /api/channels/[id] — admin override
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.displayName === 'string') data.displayName = body.displayName;
  if (typeof body.logo === 'string') data.logo = body.logo || null;
  if (typeof body.category === 'string') {
    data.category = body.category;
    data.categoryMode = 'manual';
  }
  if (body.subcategory === null || typeof body.subcategory === 'string') {
    data.subcategory = body.subcategory;
  }
  if (typeof body.country === 'string') data.country = body.country || null;
  if (typeof body.language === 'string') data.language = body.language || null;
  if (typeof body.enabled === 'boolean') data.enabled = body.enabled;
  if (typeof body.featured === 'boolean') data.featured = body.featured;
  if (typeof body.trending === 'boolean') data.trending = body.trending;
  if (typeof body.liveNow === 'boolean') data.liveNow = body.liveNow;

  // Re-run auto-categorize if requested
  if (body.reAuto === true) {
    const ch = await db.channel.findUnique({ where: { id } });
    if (ch) {
      const { category, subcategory } = categorizeChannel({
        name: ch.name,
        tvgName: ch.tvgName,
        groupTitle: ch.groupTitle,
      });
      data.category = category;
      data.subcategory = subcategory;
      data.categoryMode = 'auto';
    }
  }

  const channel = await db.channel.update({
    where: { id },
    data,
    include: { playlist: true },
  });

  // increment view count when playback starts
  if (body.incrementView === true) {
    await db.channel.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  }

  const user = await getCurrentUser();
  const fav = await db.favorite.findUnique({
    where: { userId_channelId: { userId: user.id, channelId: id } },
  });
  return NextResponse.json({ channel: toChannelDTO(channel, !!fav) });
}

// DELETE /api/channels/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.channel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
