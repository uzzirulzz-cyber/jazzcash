// Auto-categorization engine — maps a channel to (category, subcategory)
// using keyword rules. Admin can override the result manually.

import { CATEGORY_RULES } from './categories';
import type { CategoryRule } from './types';

interface MatchResult {
  category: string;
  subcategory: string | null;
  matchedRule?: CategoryRule;
}

/**
 * Determine the category + subcategory for a channel based on its name,
 * tvg-name and group-title. Returns the first matching rule (subcategories
 * first because they have higher priority).
 */
export function categorizeChannel(opts: {
  name: string;
  tvgName?: string | null;
  groupTitle?: string | null;
}): MatchResult {
  const haystack = [opts.name, opts.tvgName, opts.groupTitle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!haystack) {
    return { category: 'Other Sports', subcategory: 'Multi Sports' };
  }

  // Sort rules by priority desc so subcategory rules win.
  const sorted = [...CATEGORY_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        return { category: rule.category, subcategory: rule.subcategory, matchedRule: rule };
      }
    }
  }

  // No rule matched → default to Multi Sports.
  return { category: 'Other Sports', subcategory: 'Multi Sports' };
}

/**
 * Build a dedupe signature for a channel: lowercased name + hostname.
 * Channels with the same signature across different playlists are treated
 * as duplicates.
 */
export function channelSignature(name: string, url: string): string {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, ' ');
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    host = url.toLowerCase();
  }
  return `${cleanName}::${host}`;
}

/**
 * Best-effort country detection from group-title / name.
 */
export function detectCountry(groupTitle?: string | null, name?: string | null): string | null {
  const text = `${groupTitle ?? ''} ${name ?? ''}`.toLowerCase();
  const map: Record<string, string[]> = {
    UK: ['uk', 'united kingdom', 'england', 'britain'],
    USA: ['usa', 'united states', 'america'],
    Pakistan: ['pakistan', 'pk '],
    India: ['india', 'hindi'],
    Bangladesh: ['bangladesh', 'bd '],
    Australia: ['australia', 'aus '],
    UAE: ['uae', 'united arab emirates'],
    Saudi: ['saudi', 'ksa'],
    Germany: ['germany', 'deutschland', 'german'],
    France: ['france', 'french'],
    Spain: ['spain', 'españa', 'spanish'],
    Italy: ['italy', 'italia', 'italian'],
    Canada: ['canada', 'canadian'],
  };
  for (const [country, kws] of Object.entries(map)) {
    if (kws.some((k) => text.includes(k))) return country;
  }
  return null;
}

/**
 * Best-effort language detection.
 */
export function detectLanguage(groupTitle?: string | null, name?: string | null): string | null {
  const text = `${groupTitle ?? ''} ${name ?? ''}`.toLowerCase();
  const map: Record<string, string[]> = {
    English: ['english', 'en ', 'eng '],
    Urdu: ['urdu'],
    Hindi: ['hindi'],
    Arabic: ['arabic', 'ar '],
    Spanish: ['spanish', 'español'],
    French: ['french', 'français'],
    German: ['german', 'deutsch'],
    Italian: ['italian', 'italiano'],
  };
  for (const [lang, kws] of Object.entries(map)) {
    if (kws.some((k) => text.includes(k))) return lang;
  }
  return null;
}
