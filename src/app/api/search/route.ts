import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toChannelDTO } from '@/lib/dto';
import { getCurrentUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

// GET /api/search?q=...&category=...&country=...&language=...
// Global search across channel name, league (subcategory), team, competition,
// country, language and category.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || undefined;
  const country = searchParams.get('country') || undefined;
  const language = searchParams.get('language') || undefined;
  const limit = Math.min(Number(searchParams.get('limit')) || 60, 200);

  const user = await getCurrentUser();
  const favIds = new Set(
    (await db.favorite.findMany({ where: { userId: user.id }, select: { channelId: true } })).map(
      (f) => f.channelId,
    ),
  );

  const where: Record<string, unknown> = { enabled: true };
  if (category) where.category = category;
  if (country) where.country = country;
  if (language) where.language = language;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { displayName: { contains: q } },
      { tvgName: { contains: q } },
      { groupTitle: { contains: q } },
      { subcategory: { contains: q } },
      { category: { contains: q } },
      { country: { contains: q } },
      { language: { contains: q } },
    ];
  }

  const channels = await db.channel.findMany({
    where,
    include: { playlist: true },
    orderBy: { viewCount: 'desc' },
    take: limit,
  });

  // also return facets for the filter UI
  const [countries, languages, categories] = await Promise.all([
    db.channel.findMany({ where: { enabled: true }, select: { country: true }, distinct: ['country'] }),
    db.channel.findMany({ where: { enabled: true }, select: { language: true }, distinct: ['language'] }),
    db.channel.groupBy({ by: ['category'], where: { enabled: true }, _count: true, orderBy: { _count: { category: 'desc' } } }),
  ]);

  return NextResponse.json({
    total: channels.length,
    channels: channels.map((c) => toChannelDTO(c, favIds.has(c.id))),
    facets: {
      countries: countries.map((c) => c.country).filter(Boolean),
      languages: languages.map((l) => l.language).filter(Boolean),
      categories: categories.map((c) => ({ name: c.category, count: c._count })),
    },
  });
}
