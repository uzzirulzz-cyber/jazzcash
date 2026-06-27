import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toChannelDTO } from '@/lib/dto';
import { getCurrentUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

// GET /api/channels — list channels with filters + pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const subcategory = searchParams.get('subcategory') || undefined;
  const sourceId = searchParams.get('sourceId') || undefined;
  const status = searchParams.get('status') || undefined;
  const featured = searchParams.get('featured');
  const trending = searchParams.get('trending');
  const liveNow = searchParams.get('liveNow');
  const curated = searchParams.get('curated');
  const working = searchParams.get('working');
  const enabled = searchParams.get('enabled');
  const q = searchParams.get('q') || undefined;
  const limit = Math.min(Number(searchParams.get('limit')) || 60, 500);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);
  const sort = searchParams.get('sort') || 'name';

  const user = await getCurrentUser();
  const [favRows, subRows] = await Promise.all([
    db.favorite.findMany({ where: { userId: user.id }, select: { channelId: true } }),
    db.channelSubscription.findMany({ where: { userId: user.id }, select: { channelId: true } }),
  ]);
  const favIds = new Set(favRows.map((f) => f.channelId));
  const subIds = new Set(subRows.map((s) => s.channelId));

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (subcategory) where.subcategory = subcategory;
  if (sourceId) where.sourceId = sourceId;
  if (status) where.status = status;
  if (featured === 'true') where.featured = true;
  if (trending === 'true') where.trending = true;
  if (liveNow === 'true') where.liveNow = true;
  if (working === 'true') where.status = 'online';
  if (curated === 'true') {
    // Curated = best working channels (featured OR trending OR live now)
    where.OR = [
      { featured: true },
      { trending: true },
      { liveNow: true },
    ];
  }
  if (enabled !== 'false') where.enabled = true; // default: only enabled
  if (enabled === 'false') where.enabled = false;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { displayName: { contains: q } },
      { tvgName: { contains: q } },
      { groupTitle: { contains: q } },
      { country: { contains: q } },
      { language: { contains: q } },
    ];
  }

  const orderBy: Record<string, 'asc' | 'desc'> =
    sort === 'viewCount' ? { viewCount: 'desc' } : sort === 'recent' ? { createdAt: 'desc' } : { displayName: 'asc' };

  const [total, channels] = await Promise.all([
    db.channel.count({ where }),
    db.channel.findMany({
      where,
      include: { playlist: true },
      orderBy,
      take: limit,
      skip: offset,
    }),
  ]);

  return NextResponse.json({
    total,
    limit,
    offset,
    channels: channels.map((c) => toChannelDTO(c, favIds.has(c.id), subIds.has(c.id))),
  });
}
