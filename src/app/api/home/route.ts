import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toChannelDTO } from '@/lib/dto';
import { getCurrentUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

// GET /api/home — aggregated homepage data (hero, live, featured, trending,
// recently added, favorites, continue watching, upcoming).
export async function GET() {
  const user = await getCurrentUser();

  const favRows = await db.favorite.findMany({
    where: { userId: user.id },
    include: { channel: { include: { playlist: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const favIds = new Set(favRows.map((f) => f.channelId));

  const [
    liveNow,
    featuredFootball,
    featuredCricket,
    featuredWrestling,
    trending,
    recentlyAdded,
    continueWatching,
    favorites,
  ] = await Promise.all([
    db.channel.findMany({
      where: { enabled: true, liveNow: true },
      include: { playlist: true },
      take: 12,
      orderBy: { viewCount: 'desc' },
    }),
    db.channel.findMany({
      where: { enabled: true, category: 'Football', featured: true },
      include: { playlist: true },
      take: 12,
      orderBy: { viewCount: 'desc' },
    }),
    db.channel.findMany({
      where: { enabled: true, category: 'Cricket', featured: true },
      include: { playlist: true },
      take: 12,
      orderBy: { viewCount: 'desc' },
    }),
    db.channel.findMany({
      where: { enabled: true, category: 'Wrestling', featured: true },
      include: { playlist: true },
      take: 12,
      orderBy: { viewCount: 'desc' },
    }),
    db.channel.findMany({
      where: { enabled: true, trending: true },
      include: { playlist: true },
      take: 14,
      orderBy: { viewCount: 'desc' },
    }),
    db.channel.findMany({
      where: { enabled: true },
      include: { playlist: true },
      orderBy: { createdAt: 'desc' },
      take: 14,
    }),
    db.continueWatching.findMany({
      where: { userId: user.id },
      include: { channel: { include: { playlist: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    Promise.resolve(favRows.map((f) => f.channel)),
  ]);

  const mapFav = (c: (typeof liveNow)[number]) => toChannelDTO(c, favIds.has(c.id));

  // Hero: pick the most-viewed trending channel, fallback to live now, fallback to first featured.
  const heroPool = [...(liveNow.length ? liveNow : []), ...trending, ...featuredFootball, ...featuredCricket];
  const hero = heroPool[0] ?? null;

  // Upcoming events (static demo — could be wired to an EPG later).
  const upcoming = [
    { title: 'Manchester City vs Arsenal', league: 'Premier League', time: 'Today 22:30', category: 'Football' },
    { title: 'Mumbai Indians vs Chennai Super Kings', league: 'IPL 2026', time: 'Tomorrow 19:00', category: 'Cricket' },
    { title: 'WWE RAW Live', league: 'WWE RAW', time: 'Mon 20:00', category: 'Wrestling' },
    { title: 'UFC 312: Main Card', league: 'UFC', time: 'Sat 23:00', category: 'Wrestling' },
    { title: 'Real Madrid vs Barcelona', league: 'La Liga', time: 'Sun 01:00', category: 'Football' },
    { title: 'Pakistan vs Australia — 1st ODI', league: 'ODI', time: 'Thu 15:00', category: 'Cricket' },
  ];

  return NextResponse.json({
    hero: hero ? mapFav(hero) : null,
    liveNow: liveNow.map(mapFav),
    featuredFootball: featuredFootball.map(mapFav),
    featuredCricket: featuredCricket.map(mapFav),
    featuredWrestling: featuredWrestling.map(mapFav),
    trending: trending.map(mapFav),
    recentlyAdded: recentlyAdded.map(mapFav),
    continueWatching: continueWatching
      .filter((c) => c.channel)
      .map((c) => ({
        ...toChannelDTO(c.channel, true),
        position: c.position,
        updatedAt: c.updatedAt.toISOString(),
      })),
    favorites: favorites.map(mapFav),
    upcoming,
  });
}
