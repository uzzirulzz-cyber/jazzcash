// M3U playlist parser. Handles the standard #EXTM3U format with
// #EXTINF attributes (tvg-id, tvg-name, tvg-logo, group-title) and
// degrades gracefully for malformed entries.

import type { ParsedChannel } from './types';

const ATTR_RE = /([a-zA-Z0-9-]+)="([^"]*)"/g;

function parseAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(line)) !== null) {
    attrs[m[1].toLowerCase()] = m[2];
  }
  return attrs;
}

function extractName(line: string): string {
  // name is everything after the last comma
  const commaIdx = line.lastIndexOf(',');
  if (commaIdx === -1) return '';
  return line.slice(commaIdx + 1).trim();
}

/**
 * Parse raw M3U text into a list of channels.
 */
export function parseM3U(content: string): ParsedChannel[] {
  const lines = content.split(/\r?\n/);
  const channels: ParsedChannel[] = [];

  let pending:
    | {
        attrs: Record<string, string>;
        name: string;
      }
    | null = null;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#EXTM3U')) continue;

    if (line.startsWith('#EXTINF')) {
      const attrs = parseAttributes(line);
      const name = extractName(line) || attrs['tvg-name'] || '';
      pending = { attrs, name };
      continue;
    }

    // ignore other directives
    if (line.startsWith('#')) continue;

    // This is a URL line — pair it with the pending EXTINF.
    const url = line;
    if (!pending) {
      // URL without EXTINF — synthesize a minimal entry.
      const name = url.split('/').pop() || 'Unknown';
      channels.push({ name, url });
    } else {
      const group = pending.attrs['group-title'] || '';
      channels.push({
        name: pending.name || pending.attrs['tvg-name'] || 'Unknown',
        url,
        logo: pending.attrs['tvg-logo'] || undefined,
        tvgId: pending.attrs['tvg-id'] || undefined,
        tvgName: pending.attrs['tvg-name'] || undefined,
        groupTitle: group || undefined,
        country: undefined,
        language: undefined,
      });
    }
    pending = null;
  }

  return channels;
}

/**
 * Fetch + parse an M3U playlist from a URL. Throws on network error.
 */
export async function fetchAndParseM3U(url: string): Promise<ParsedChannel[]> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IPTV-Sports-Platform/1.0)',
    },
    // some playlists are large; allow generous time
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  if (!text.includes('#EXTM3U') && !text.includes('#EXTINF')) {
    throw new Error('Response is not a valid M3U playlist');
  }
  return parseM3U(text);
}
