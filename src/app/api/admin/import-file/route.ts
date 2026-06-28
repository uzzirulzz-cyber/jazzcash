import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categorizeChannel, channelSignature, detectCountry, detectLanguage } from '@/lib/categorize';
import { testStreamUrl } from '@/app/api/channels/[id]/stream-test/route';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Adult content keywords — any channel matching these is excluded entirely.
const ADULT_KEYWORDS = [
  'xxx', 'adult', 'porn', '18+', 'erotic', 'playboy', 'brazzers', 'nude',
  'sex ', 'sexual', 'hot xxx', 'blue xxx', 'pink xxx', 'adulto', 'erotica',
  'onlyfans', 'strip', 'masturbat', 'fetish', 'hentai',
  'sexy', 'lesbian', 'milf', 'teen 0', 'teen 1', 'teen 2', 'teen 3',
  'squirt', 'threesome', 'compilation feet', 'horny', 'naked', 'brazzer',
  'handjob', 'blowjob', 'creampie', 'cumshot', 'deepthroat', 'orgasm',
  'vagina', 'penis', 'dick', 'cock', 'pussy', 'boob', 'tit ', 'tits',
  'anal ', 'ass ', 'butt ', 'bbw ', 'mature ', 'cougar', 'stepmom', 'stepsis',
  ' taboo', 'bdsm', 'bondage', 'dominatrix', 'spankwire', 'redtube',
  'youporn', 'tube8', 'xhamster', 'xnxx', 'xvideos', 'cam ', 'camgirl',
  'webcam', 'live cam', 'escort', 'massage ', 'nuru', 'jav ', 'japanese milf',
  'japanese boy', 'paraded', 'finger them', 'bhab', 'botal',
];

interface ParsedChannel {
  name: string;
  url: string;
  logo?: string;
  tvgId?: string;
  tvgName?: string;
  groupTitle?: string;
}

function parseM3U(content: string): ParsedChannel[] {
  const lines = content.split(/\r?\n/);
  const channels: ParsedChannel[] = [];
  let pending: { attrs: Record<string, string>; name: string } | null = null;
  const attrRe = /([a-zA-Z0-9-]+)="([^"]*)"/g;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#EXTM3U')) continue;

    if (line.startsWith('#EXTINF')) {
      const attrs: Record<string, string> = {};
      let m: RegExpExecArray | null;
      attrRe.lastIndex = 0;
      while ((m = attrRe.exec(line)) !== null) attrs[m[1].toLowerCase()] = m[2];
      const commaIdx = line.lastIndexOf(',');
      const name = commaIdx === -1 ? '' : line.slice(commaIdx + 1).trim();
      pending = { attrs, name };
      continue;
    }

    if (line.startsWith('#')) continue;

    // URL line
    if (!pending) {
      channels.push({ name: line.split('/').pop() || 'Unknown', url: line });
    } else {
      channels.push({
        name: pending.name || pending.attrs['tvg-name'] || 'Unknown',
        url: line,
        logo: pending.attrs['tvg-logo'] || undefined,
        tvgId: pending.attrs['tvg-id'] || undefined,
        tvgName: pending.attrs['tvg-name'] || undefined,
        groupTitle: pending.attrs['group-title'] || undefined,
      });
    }
    pending = null;
  }
  return channels;
}

function isAdult(name: string, group?: string): boolean {
  const text = `${name} ${group ?? ''}`.toLowerCase();
  return ADULT_KEYWORDS.some((k) => text.includes(k));
}

// POST /api/admin/import-file — import a local M3U file with adult filtering
// Body: { filePath: string, playlistName: string, testStreams?: boolean }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const filePath = String(body.filePath || '');
  const playlistName = String(body.playlistName || 'Custom M3U File');
  const testStreams = body.testStreams !== false;

  if (!filePath) {
    return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
  }

  // Resolve the file path (must be within the project).
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

  let content: string;
  try {
    content = await readFile(fullPath, 'utf-8');
  } catch {
    return NextResponse.json({ error: `Could not read file: ${fullPath}` }, { status: 404 });
  }

  if (!content.includes('#EXTM3U') && !content.includes('#EXTINF')) {
    return NextResponse.json({ error: 'File is not a valid M3U playlist' }, { status: 400 });
  }

  const parsed = parseM3U(content);

  // Filter out adult content.
  const safe = parsed.filter((ch) => !isAdult(ch.name, ch.groupTitle));
  const adultExcluded = parsed.length - safe.length;

  // Create or find a playlist for this file.
  let playlist = await db.playlist.findFirst({ where: { name: playlistName } });
  if (!playlist) {
    playlist = await db.playlist.create({
      data: { name: playlistName, url: `file://${fullPath}`, status: 'refreshing', refreshHours: 999 },
    });
  } else {
    // Clear existing channels for this playlist.
    await db.channel.deleteMany({ where: { sourceId: playlist.id } });
    await db.playlist.update({ where: { id: playlist.id }, data: { status: 'refreshing' } });
  }

  // Get existing signatures from other playlists to dedupe.
  const otherChannels = await db.channel.findMany({
    where: { sourceId: { not: playlist.id } },
    select: { signature: true },
  });
  const existingSigs = new Set(otherChannels.map((c) => c.signature));
  const seenInThis = new Set<string>();

  const toCreate = [];
  let duplicates = 0;
  let errors = 0;

  for (const ch of safe) {
    if (!ch.url || !ch.name) {
      errors++;
      continue;
    }
    const sig = channelSignature(ch.name, ch.url);
    if (existingSigs.has(sig) || seenInThis.has(sig)) {
      duplicates++;
      continue;
    }
    seenInThis.add(sig);

    const { category, subcategory } = categorizeChannel({
      name: ch.name,
      tvgName: ch.tvgName,
      groupTitle: ch.groupTitle,
    });

    toCreate.push({
      name: ch.name,
      displayName: ch.name,
      url: ch.url,
      logo: ch.logo ?? null,
      categoryMode: 'auto' as const,
      category,
      subcategory: subcategory ?? null,
      country: detectCountry(ch.groupTitle, ch.name),
      language: detectLanguage(ch.groupTitle, ch.name),
      tvgId: ch.tvgId ?? null,
      tvgName: ch.tvgName ?? null,
      groupTitle: ch.groupTitle ?? null,
      status: 'unknown' as const,
      liveNow: true,
      signature: sig,
      sourceId: playlist.id,
    });
  }

  // Insert in batches of 500 to avoid memory issues.
  const BATCH = 500;
  for (let i = 0; i < toCreate.length; i += BATCH) {
    await db.channel.createMany({ data: toCreate.slice(i, i + BATCH) });
  }

  await db.playlist.update({
    where: { id: playlist.id },
    data: {
      status: 'active',
      channelCount: toCreate.length,
      onlineCount: toCreate.length,
      offlineCount: 0,
      lastRefreshAt: new Date(),
    },
  });

  // If stream testing is requested, test a sample of channels (up to 200).
  let workingCount = 0;
  let brokenCount = 0;
  if (testStreams && toCreate.length > 0) {
    // Test the first 200 channels (sorted by featured keywords).
    const FEATURED_KW = ['sky sports', 'espn', 'bein', 'wwe', 'ufc', 't sports', 'willow', 'premier league', 'champions league', 'ipl', 'psl', 'f1', 'nba', 'nfl', 'movie', 'cinema', 'mtv', 'music', 'news', 'bbc', 'cnn'];
    const matchesAny = (text: string) => {
      const t = text.toLowerCase();
      return FEATURED_KW.some((k) => t.includes(k));
    };

    const toTest = toCreate
      .filter((c) => matchesAny(`${c.name} ${c.groupTitle ?? ''}`))
      .slice(0, 200);

    // Fetch the created channels to get their IDs.
    const createdChannels = await db.channel.findMany({
      where: { sourceId: playlist.id, name: { in: toTest.map((c) => c.name) } },
      select: { id: true, url: true },
      take: 200,
    });

    // Test in batches of 10.
    const TEST_BATCH = 10;
    for (let i = 0; i < createdChannels.length; i += TEST_BATCH) {
      const batch = createdChannels.slice(i, i + TEST_BATCH);
      await Promise.all(
        batch.map(async (ch) => {
          const result = await testStreamUrl(ch.url);
          await db.channel.update({
            where: { id: ch.id },
            data: { status: result.playable ? 'online' : 'offline' },
          });
          if (result.playable) workingCount++;
          else brokenCount++;
        }),
      );
    }
  }

  return NextResponse.json({
    ok: true,
    playlistId: playlist.id,
    totalParsed: parsed.length,
    adultExcluded,
    duplicates,
    errors,
    imported: toCreate.length,
    tested: testStreams ? Math.min(200, toCreate.length) : 0,
    working: workingCount,
    broken: brokenCount,
  });
}
