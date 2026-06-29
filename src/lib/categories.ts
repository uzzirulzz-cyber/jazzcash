// Sports category hierarchy + keyword-based auto-mapping rules.
// This drives the "Intelligent Categorization" feature.

import type { CategoryRule } from './types';

export interface CategoryDef {
  name: string;
  slug: string;
  icon: string; // lucide icon name
  color: string; // tailwind text color class for accents
  subcategories: { name: string; slug: string; keywords: string[] }[];
  /** default keywords used when no subcategory matches */
  fallbackKeywords: string[];
}

// The full hierarchy requested by the user.
export const CATEGORY_TREE: CategoryDef[] = [
  {
    name: 'Adult',
    slug: 'adult',
    icon: 'AlertOctagon',
    color: 'text-red-600',
    subcategories: [
      { name: 'Adult Live', slug: 'adult-live', keywords: ['xxx', 'adult live', 'live xxx', 'pink tv', 'midnight', 'super one', 'superone', 'xtsy', 'fresh!', 'flirt', 'jktv'] },
      { name: 'Adult Movies', slug: 'adult-movies', keywords: ['brazzers', 'playboy', 'hustler', 'redlight', 'private spice', 'venus', 'dhc', 'adult movie', 'xxx movie', 'erotic movie', 'porn'] },
      { name: 'Adult Premium', slug: 'adult-premium', keywords: ['adult premium', 'xxx premium', 'erotic premium', 'babes', 'hentai', 'milf', 'orgasm', 'strip', 'nude', 'sex', 'erotic'] },
      { name: 'Adult 18+', slug: 'adult-18-plus', keywords: ['18+', '18 plus', 'xxx', 'adult', 'porn'] },
    ],
    fallbackKeywords: ['xxx', 'adult', 'porn', '18+', 'erotic', 'sex', 'nude', 'brazzers', 'playboy', 'hustler', 'redlight', 'pink tv', 'babes', 'masturbat', 'orgasm', 'strip', 'milf', 'hentai', 'dhc', 'venus', 'super one', 'superone', 'midnight', 'private spice', 'xtsy', 'fresh!', 'flirt', 'jktv'],
  },
  {
    name: 'Football',
    slug: 'football',
    icon: 'Trophy',
    color: 'text-emerald-500',
    subcategories: [
      { name: 'Live Football', slug: 'live-football', keywords: ['live football', 'live soccer', 'live foot'] },
      { name: 'Premier League', slug: 'premier-league', keywords: ['premier league', 'epl', 'sky sports premier', 'tnt sports', 'tnt football', 'bt sport 1', 'bt sport 2'] },
      { name: 'UEFA Champions League', slug: 'uefa-champions-league', keywords: ['champions league', 'ucl'] },
      { name: 'Europa League', slug: 'europa-league', keywords: ['europa league', 'uel', 'conference league'] },
      { name: 'La Liga', slug: 'la-liga', keywords: ['la liga', 'laliga', 'liga espa', 'liga es'] },
      { name: 'Serie A', slug: 'serie-a', keywords: ['serie a', 'italian league', 'calcio'] },
      { name: 'Bundesliga', slug: 'bundesliga', keywords: ['bundesliga'] },
      { name: 'Ligue 1', slug: 'ligue-1', keywords: ['ligue 1', 'ligue1', 'ligue une'] },
      { name: 'MLS', slug: 'mls', keywords: ['mls', 'major league soccer'] },
      { name: 'Saudi Pro League', slug: 'saudi-pro-league', keywords: ['saudi pro league', 'spl ', 'spl|', 'rosen', 'dazn saudi', 'ssr', 'saudi league'] },
      { name: 'International Football', slug: 'international-football', keywords: ['international football', 'internationals', 'world cup qualif', ' qualifiers'] },
      { name: 'World Cup', slug: 'world-cup', keywords: ['world cup', 'fifa'] },
      { name: 'AFC Competitions', slug: 'afc-competitions', keywords: ['afc', 'asian champions', 'asian cup', 'acl ' ] },
      { name: 'Match Highlights', slug: 'match-highlights', keywords: ['highlights', 'football highlights', 'goals show'] },
      { name: 'Match Replays', slug: 'match-replays', keywords: ['replay', 'replays', 'match replay', 'full match'] },
    ],
    fallbackKeywords: ['football', 'soccer', 'foot ', 'futbol', 'fútbol', 'fc ', 'fc|', 'united tv', 'city tv', 'lfc tv', 'chelsea tv', 'bayern tv', 'barca tv', 'real madrid tv'],
  },
  {
    name: 'Cricket',
    slug: 'cricket',
    icon: 'Target',
    color: 'text-amber-500',
    subcategories: [
      { name: 'Live Cricket', slug: 'live-cricket', keywords: ['live cricket'] },
      { name: 'IPL', slug: 'ipl', keywords: ['ipl', 'indian premier league', 'ipl 2025', 'ipl 2026'] },
      { name: 'PSL', slug: 'psl', keywords: ['psl', 'pakistan super league'] },
      { name: 'BBL', slug: 'bbl', keywords: ['bbl', 'big bash', 'big bash league'] },
      { name: 'CPL', slug: 'cpl', keywords: ['cpl', 'caribbean premier'] },
      { name: 'ICC Events', slug: 'icc-events', keywords: ['icc ', 'icc|', 'icc world', 't20 world cup', 'world cup cricket'] },
      { name: 'Asia Cup', slug: 'asia-cup', keywords: ['asia cup'] },
      { name: 'Test Cricket', slug: 'test-cricket', keywords: ['test cricket', 'test match'] },
      { name: 'ODI', slug: 'odi', keywords: ['odi ', 'odi|', 'one day international'] },
      { name: 'T20', slug: 't20', keywords: ['t20 ', 't20|', 't20i'] },
      { name: 'Highlights', slug: 'cricket-highlights', keywords: ['cricket highlights', 'cricket extra'] },
      { name: 'Classic Matches', slug: 'classic-matches', keywords: ['classic cricket', 'cricket classic'] },
    ],
    fallbackKeywords: ['cricket', 'willow', 'sky cricket', 't sports', 'tsports', 't-sports', 'sony ten', 'sony sports ten', 'supersport cricket', 'star cricket', 'gtv', 'ptv sports', 'ten cricket', 'ten sports'],
  },
  {
    name: 'Wrestling',
    slug: 'wrestling',
    icon: 'Swords',
    color: 'text-rose-500',
    subcategories: [
      { name: 'WWE RAW', slug: 'wwe-raw', keywords: ['wwe raw', 'monday night raw', 'raw '] },
      { name: 'SmackDown', slug: 'smackdown', keywords: ['smackdown', 'smack down', 'smackdown '] },
      { name: 'NXT', slug: 'nxt', keywords: ['nxt'] },
      { name: 'AEW', slug: 'aew', keywords: ['aew', 'all elite wrestling', 'dynamite', 'rampage'] },
      { name: 'UFC', slug: 'ufc', keywords: ['ufc', 'ufc tv', 'fight pass'] },
      { name: 'PPV Events', slug: 'ppv-events', keywords: ['ppv', 'pay per view', 'pay-per-view'] },
      { name: 'WrestleMania', slug: 'wrestlemania', keywords: ['wrestlemania'] },
      { name: 'Royal Rumble', slug: 'royal-rumble', keywords: ['royal rumble'] },
      { name: 'SummerSlam', slug: 'summerslam', keywords: ['summerslam', 'summer slam'] },
      { name: 'Archives', slug: 'archives', keywords: ['wrestling archive', 'wwe archive', 'classic wrestling', 'wwe network'] },
    ],
    fallbackKeywords: ['wwe', 'wrestling', 'fight network', 'impact wrestling', 'tna', 'roh wrestling', 'njpw', 'new japan'],
  },
  {
    name: 'Other Sports',
    slug: 'other-sports',
    icon: 'Medal',
    color: 'text-violet-500',
    subcategories: [
      { name: 'Basketball', slug: 'basketball', keywords: ['basketball', 'nba', 'ncaa basket', 'euroleague basket', 'bbl basket'] },
      { name: 'Tennis', slug: 'tennis', keywords: ['tennis', 'atp', 'wta', 'grand slam tennis'] },
      { name: 'Baseball', slug: 'baseball', keywords: ['baseball', 'mlb', 'npb', 'kbo'] },
      { name: 'Formula 1', slug: 'formula-1', keywords: ['formula 1', 'f1', 'formula one', 'f1 tv'] },
      { name: 'MotoGP', slug: 'motogp', keywords: ['motogp', 'moto gp', 'moto2', 'moto3', 'moto e'] },
      { name: 'Boxing', slug: 'boxing', keywords: ['boxing', 'boxe', 'boxing tv'] },
      { name: 'MMA', slug: 'mma', keywords: ['mma', 'bellator', 'one championship', 'one fc', 'pfl'] },
      { name: 'Golf', slug: 'golf', keywords: ['golf', 'pga', 'european tour golf', 'lpga'] },
      { name: 'Rugby', slug: 'rugby', keywords: ['rugby', 'super rugby', 'six nations', 'rugby league'] },
      { name: 'Ice Hockey', slug: 'ice-hockey', keywords: ['ice hockey', 'nhl', 'hockey'] },
      { name: 'Olympics', slug: 'olympics', keywords: ['olympic', 'olympics', 'olympic channel'] },
      { name: 'Multi Sports', slug: 'multi-sports', keywords: ['espn', 'euro sport', 'eurosport', 'sky sports', 'sky sport', 'bt sport', 'fox sports', 'bein', 'bein sports', 'supersport', 'sportsnet', 'tsn', 'sports tv', 'sports 1', 'sports 2', 'ten sports', 'sony sports'] },
    ],
    fallbackKeywords: ['sports', 'sport channel', 'sport tv'],
  },
  {
    name: 'Movies',
    slug: 'movies',
    icon: 'Film',
    color: 'text-rose-500',
    subcategories: [
      { name: 'Action Movies', slug: 'action-movies', keywords: ['action movie', 'action cinema', 'action film'] },
      { name: 'Comedy Movies', slug: 'comedy-movies', keywords: ['comedy movie', 'comedy central', 'comedy film'] },
      { name: 'Horror Movies', slug: 'horror-movies', keywords: ['horror movie', 'horror channel', 'horror film'] },
      { name: 'Bollywood Movies', slug: 'bollywood-movies', keywords: ['bollywood', 'hindi movie', 'zee cinema', 'sony max', 'star gold', 'utv'] },
      { name: 'Hollywood Movies', slug: 'hollywood-movies', keywords: ['hollywood', 'movie channel', 'cinema tv', 'film channel'] },
      { name: 'Classic Movies', slug: 'classic-movies', keywords: ['classic movie', 'retro cinema', 'classic film', 'golden age'] },
      { name: 'Anime Movies', slug: 'anime-movies', keywords: ['anime', 'anime channel', 'anime tv'] },
    ],
    fallbackKeywords: ['movie', 'movies', 'cinema', 'film', 'flix', 'cine', 'hbo', 'showtime', 'starz', 'mgm', 'paramount'],
  },
  {
    name: 'Music',
    slug: 'music',
    icon: 'Music',
    color: 'text-purple-500',
    subcategories: [
      { name: 'Pop Music', slug: 'pop-music', keywords: ['pop music', 'mtv', 'mtv hits', 'vh1'] },
      { name: 'Rock Music', slug: 'rock-music', keywords: ['rock music', 'rock tv', 'kerrang'] },
      { name: 'Classical Music', slug: 'classical-music', keywords: ['classical music', 'classical tv', 'opera', 'symphony'] },
      { name: 'Hip Hop Music', slug: 'hip-hop-music', keywords: ['hip hop', 'rap tv', 'hiphop', 'bet'] },
      { name: 'Country Music', slug: 'country-music', keywords: ['country music', 'cmt', 'country tv'] },
      { name: 'Electronic Music', slug: 'electronic-music', keywords: ['electronic', 'edm', 'dance music', 'trance'] },
      { name: 'World Music', slug: 'world-music', keywords: ['world music', 'vevo', 'music video', 'muzik', 'musiq'] },
    ],
    fallbackKeywords: ['music', 'mtv', 'vh1', 'vevo', 'music tv', 'music channel', 'muzik', 'musiq', 'song'],
  },
  {
    name: 'Web Series',
    slug: 'web-series',
    icon: 'MonitorPlay',
    color: 'text-cyan-500',
    subcategories: [
      { name: 'Drama Series', slug: 'drama-series', keywords: ['drama series', 'drama tv', 'television drama'] },
      { name: 'Thriller Series', slug: 'thriller-series', keywords: ['thriller', 'crime series', 'mystery'] },
      { name: 'Reality TV', slug: 'reality-tv', keywords: ['reality tv', 'reality show', 'big brother', 'survivor'] },
      { name: 'Talk Shows', slug: 'talk-shows', keywords: ['talk show', 'tonight show', 'jimmy', 'late night'] },
      { name: 'Documentaries', slug: 'documentaries', keywords: ['documentary', 'docu', 'national geographic', 'discovery', 'history channel'] },
      { name: 'Kids Shows', slug: 'kids-shows', keywords: ['cartoon', 'disney', 'nickelodeon', 'cartoon network', 'kids tv', 'baby'] },
      { name: 'News Series', slug: 'news-series', keywords: ['news', 'bbc news', 'cnn', 'fox news', 'sky news', 'al jazeera'] },
    ],
    fallbackKeywords: ['series', 'tv show', 'episode', 'season', 'entertainment', 'entertainment tv', 'novela', 'telenovela'],
  },
];

// Build the ordered rule list used by the auto-mapper.
// Subcategory rules run first (higher priority), then parent fallback rules.
// Adult rules get an even higher priority (200/20) so adult content always wins
// over Movies/Sports regardless of other keyword matches.
export const CATEGORY_RULES: CategoryRule[] = (() => {
  const rules: CategoryRule[] = [];
  for (const cat of CATEGORY_TREE) {
    const isAdult = cat.name === 'Adult';
    for (const sub of cat.subcategories) {
      rules.push({
        category: cat.name,
        subcategory: sub.name,
        keywords: sub.keywords,
        priority: isAdult ? 200 : 100,
      });
    }
  }
  // parent fallback rules — lower priority
  for (const cat of CATEGORY_TREE) {
    const isAdult = cat.name === 'Adult';
    rules.push({
      category: cat.name,
      subcategory: null,
      keywords: cat.fallbackKeywords,
      priority: isAdult ? 50 : 10,
    });
  }
  return rules;
})();

export const DEFAULT_SPORT_ICONS: Record<string, string> = {
  Adult: 'AlertOctagon',
  Football: 'Trophy',
  Cricket: 'Target',
  Wrestling: 'Swords',
  'Other Sports': 'Medal',
  Movies: 'Film',
  Music: 'Music',
  'Web Series': 'MonitorPlay',
};

export const DEFAULT_SPORT_COLORS: Record<string, string> = {
  Adult: 'text-red-600',
  Football: 'text-emerald-500',
  Cricket: 'text-amber-500',
  Wrestling: 'text-rose-500',
  'Other Sports': 'text-violet-500',
  Movies: 'text-rose-500',
  Music: 'text-purple-500',
  'Web Series': 'text-cyan-500',
};
