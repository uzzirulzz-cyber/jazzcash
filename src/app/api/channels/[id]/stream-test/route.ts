import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

// GET /api/channels/[id]/stream-test — test if a stream URL actually plays
// Returns { playable: boolean, reason: string, contentType?: string }
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await import('@/lib/db');
  const channel = await db.channel.findUnique({ where: { id }, select: { url: true, name: true } });
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await testStreamUrl(channel.url);
  return NextResponse.json(result);
}

/** Test a stream URL by fetching headers. Returns playable status + reason. */
export async function testStreamUrl(url: string): Promise<{
  playable: boolean;
  reason: string;
  contentType?: string;
  statusCode?: number;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Range': 'bytes=0-1023',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const contentType = res.headers.get('content-type') || '';
    const status = res.status;

    // 200, 206 (partial content), 302/301 (redirect) are OK
    if (status === 200 || status === 206 || status === 302 || status === 301) {
      // Check if it's actually a video/HLS stream
      const isVideo = contentType.includes('video') || contentType.includes('mpegurl') || contentType.includes('octet-stream') || url.includes('.m3u8');
      return {
        playable: true,
        reason: isVideo ? 'Stream is live and playable' : 'Stream responds (may need direct playback)',
        contentType,
        statusCode: status,
      };
    }
    return { playable: false, reason: `HTTP ${status} — stream rejected the request`, statusCode: status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('abort') || msg.includes('timeout')) {
      return { playable: false, reason: 'Stream timed out — likely offline or geo-blocked' };
    }
    if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      return { playable: false, reason: 'Stream server unreachable — channel is offline' };
    }
    return { playable: false, reason: `Network error: ${msg.slice(0, 100)}` };
  }
}
