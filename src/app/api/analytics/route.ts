import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { AnalyticsDTO } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/analytics — dashboard metrics
export async function GET() {
  const [
    totalChannels,
    onlineChannels,
    offlineChannels,
    disabledChannels,
    totalPlaylists,
    activePlaylists,
    featuredChannels,
    trendingChannels,
    liveNowChannels,
    totalFavorites,
    channelViews,
  ] = await Promise.all([
    db.channel.count(),
    db.channel.count({ where: { status: 'online' } }),
    db.channel.count({ where: { status: 'offline' } }),
    db.channel.count({ where: { enabled: false } }),
    db.playlist.count(),
    db.playlist.count({ where: { enabled: true, status: 'active' } }),
    db.channel.count({ where: { featured: true } }),
    db.channel.count({ where: { trending: true } }),
    db.channel.count({ where: { liveNow: true } }),
    db.favorite.count(),
    db.channel.aggregate({ _sum: { viewCount: true } }),
  ]);

  const byCategoryRows = await db.channel.groupBy({
    by: ['category'],
    _count: true,
    orderBy: { _count: { category: 'desc' } },
  });

  const playlists = await db.playlist.findMany();
  const playlistHealth = playlists.map((p) => ({
    id: p.id,
    name: p.name,
    channelCount: p.channelCount,
    onlineCount: p.onlineCount,
    offlineCount: p.offlineCount,
    health: p.channelCount > 0 ? Math.round((p.onlineCount / p.channelCount) * 100) : 0,
  }));

  const topChannelsRows = await db.channel.findMany({
    orderBy: { viewCount: 'desc' },
    take: 10,
    select: { id: true, name: true, viewCount: true, logo: true },
  });

  const dto: AnalyticsDTO = {
    totalChannels,
    onlineChannels,
    offlineChannels,
    disabledChannels,
    totalPlaylists,
    activePlaylists,
    featuredChannels,
    trendingChannels,
    liveNowChannels,
    totalFavorites,
    totalViews: channelViews._sum.viewCount ?? 0,
    byCategory: byCategoryRows.map((r) => ({ category: r.category, count: r._count })),
    playlistHealth,
    topChannels: topChannelsRows,
  };

  return NextResponse.json(dto);
}
