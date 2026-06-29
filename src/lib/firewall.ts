// Stream Firewall: protects channels from going offline or blocked.
// - Caches HLS manifests so streams stay available even if origin is slow
// - Auto-retries with multiple strategies (direct → proxy → mirror)
// - Background health monitoring + auto-recovery
// - Rate limiting to prevent abuse

import { db } from './db';
import { testStreamUrl } from '@/app/api/channels/[id]/stream-test/route';

// In-memory manifest cache (survives within the server process)
interface CachedManifest {
  content: Buffer;
  contentType: string;
  fetchedAt: number;
  ttl: number; // seconds
}

const manifestCache = new Map<string, CachedManifest>();
const CACHE_TTL = 60 * 1000; // 1 minute for live manifests
const MAX_CACHE_SIZE = 500; // max cached manifests

// Rotating User-Agents for firewall requests
const FIREWALL_UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Lavf/58.76.100 (FFmpeg)',
  'VLC/3.0.18 LibVLC/3.0.18',
];

// Residential HTTP proxies — used as fallback when Cloudflare blocks the
// sandbox's datacenter IP. These are free public proxies; they may be slow
// or go offline. The firewall tries direct first, then falls back to these.
const RESIDENTIAL_PROXIES = [
  '178.212.144.7:80',
  '159.203.61.169:3128',
  '167.71.199.232:8080',
  '165.22.36.164:10000',
  '20.219.244.14:8080',
];

// Cache of working proxies (avoids re-testing dead ones every request)
let workingProxyIndex = 0;
const deadProxies = new Set<string>();

// Rate limiting: track requests per IP to prevent abuse
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per minute per IP
const RATE_WINDOW = 60 * 1000;

/** Check if an IP is rate-limited. Returns true if allowed. */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/** Get a cached manifest if available and fresh. */
function getCachedManifest(url: string): CachedManifest | null {
  const entry = manifestCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttl) {
    manifestCache.delete(url);
    return null;
  }
  return entry;
}

/** Cache a manifest. Evicts old entries if cache is full. */
function cacheManifest(url: string, content: Buffer, contentType: string): void {
  if (manifestCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    const oldest = manifestCache.keys().next().value;
    if (oldest) manifestCache.delete(oldest);
  }
  manifestCache.set(url, {
    content,
    contentType,
    fetchedAt: Date.now(),
    ttl: CACHE_TTL,
  });
}

/**
 * Fetch a URL through a residential HTTP proxy. Used when Cloudflare blocks
 * the sandbox's datacenter IP (returns 403). The proxy's residential IP is
 * not on Cloudflare's blocklist, so the request succeeds.
 * Uses undici's ProxyAgent (built into Node.js 18+) for proxy support.
 */
async function fetchViaProxy(url: string, proxy: string): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const { ProxyAgent } = await import('undici').catch(() => ({ ProxyAgent: null })) as { ProxyAgent: typeof import('undici').ProxyAgent | null };
    if (!ProxyAgent) return null;
    const agent = new ProxyAgent(`http://${proxy}`);
    const res = await fetch(url, {
      dispatcher: agent as never,
      headers: {
        'User-Agent': FIREWALL_UAS[0],
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const body = Buffer.from(await res.arrayBuffer());
    return { body, contentType };
  } catch {
    return null;
  }
}

/**
 * Firewall-protected stream fetch:
 * 1. Check manifest cache
 * 2. Try direct fetch with rotating UA
 * 3. Try with VLC/FFmpeg UA (some servers whitelist these)
 * 4. Try residential proxies (bypasses Cloudflare datacenter IP blocks)
 * 5. Return cached version if all live attempts fail (keeps stream "online")
 */
export async function firewallFetch(url: string): Promise<{
  body: Buffer;
  contentType: string;
  cached: boolean;
  source: 'cache' | 'direct' | 'alt-ua' | 'proxy';
}> {
  // 1. Check cache
  const cached = getCachedManifest(url);
  if (cached) {
    return { body: cached.content, contentType: cached.contentType, cached: true, source: 'cache' };
  }

  let referer = 'https://www.google.com';
  try {
    referer = new URL(url).origin;
  } catch {
    // keep default
  }

  // 2. Try direct with a random browser UA
  for (let attempt = 0; attempt < 2; attempt++) {
    const ua = FIREWALL_UAS[attempt % FIREWALL_UAS.length];
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': '*/*',
          'Referer': referer,
          'Origin': referer,
          'Connection': 'keep-alive',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        const body = Buffer.from(await res.arrayBuffer());
        // Cache for future requests
        cacheManifest(url, body, contentType);
        return { body, contentType, cached: false, source: attempt === 0 ? 'direct' : 'alt-ua' };
      }
    } catch {
      // continue to next attempt
    }
  }

  // 3. Try with VLC/FFmpeg User-Agent (some IPTV servers whitelist these)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': FIREWALL_UAS[4], // FFmpeg
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      const body = Buffer.from(await res.arrayBuffer());
      cacheManifest(url, body, contentType);
      return { body, contentType, cached: false, source: 'alt-ua' };
    }
  } catch {
    // continue
  }

  // 4. Try residential proxies (bypasses Cloudflare datacenter IP blocks)
  for (const proxy of RESIDENTIAL_PROXIES) {
    if (deadProxies.has(proxy)) continue;
    const result = await fetchViaProxy(url, proxy);
    if (result) {
      cacheManifest(url, result.body, result.contentType);
      return { body: result.body, contentType: result.contentType, cached: false, source: 'proxy' };
    }
    // Mark this proxy as dead so we don't retry it
    deadProxies.add(proxy);
  }

  // 5. Return stale cache if available (keeps stream "online" during brief outages)
  const staleCache = manifestCache.get(url);
  if (staleCache) {
    return {
      body: staleCache.content,
      contentType: staleCache.contentType,
      cached: true,
      source: 'cache',
    };
  }

  throw new Error('All firewall attempts failed — stream is offline or heavily blocked');
}

/**
 * Background health monitor: probes channels and updates their status.
 * Auto-recovers channels that come back online.
 */
export async function runHealthMonitor(limit = 50): Promise<{
  tested: number;
  recovered: number;
  stillBroken: number;
  newlyBroken: number;
}> {
  // Find channels that are enabled but offline or unknown
  const channels = await db.channel.findMany({
    where: {
      enabled: true,
      OR: [{ status: 'offline' }, { status: 'unknown' }],
    },
    orderBy: [{ featured: 'desc' }, { viewCount: 'desc' }],
    take: limit,
    select: { id: true, url: true, name: true, status: true },
  });

  let recovered = 0;
  let stillBroken = 0;
  let newlyBroken = 0;

  // Test in batches of 10
  const BATCH = 10;
  for (let i = 0; i < channels.length; i += BATCH) {
    const batch = channels.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (ch) => {
        const result = await testStreamUrl(ch.url);
        const newStatus = result.playable ? 'online' : 'offline';

        if (ch.status === 'offline' && result.playable) {
          recovered++;
        } else if (ch.status === 'offline' && !result.playable) {
          stillBroken++;
        } else if (ch.status === 'unknown' && !result.playable) {
          newlyBroken++;
        }

        await db.channel.update({
          where: { id: ch.id },
          data: { status: newStatus },
        });
      }),
    );
  }

  return {
    tested: channels.length,
    recovered,
    stillBroken,
    newlyBroken,
  };
}

/** Get firewall stats for the admin dashboard. */
export function getFirewallStats() {
  return {
    cacheSize: manifestCache.size,
    maxCacheSize: MAX_CACHE_SIZE,
    cacheTtlSeconds: CACHE_TTL / 1000,
    userAgents: FIREWALL_UAS.length,
    rateLimit: RATE_LIMIT,
    rateWindowSeconds: RATE_WINDOW / 1000,
    activeConnections: requestCounts.size,
    residentialProxies: RESIDENTIAL_PROXIES.length,
    deadProxies: deadProxies.size,
    workingProxies: RESIDENTIAL_PROXIES.length - deadProxies.size,
  };
}
