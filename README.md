# PlayBeat Arena — Multi-M3U Sports Streaming Platform

A production-ready IPTV sports streaming platform built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, and Prisma. It accepts up to three independent M3U playlist URLs as its primary content source and presents users with a single, polished sports streaming experience where content is automatically organized into Football, Cricket, Wrestling, and Other Sports sections.

## Features

### Content Sources
- Accepts up to **3 independent M3U playlist URLs**
- Imports all playlists, merges channels, removes duplicates
- Auto-refresh every 6 hours (configurable)
- Stream health detection
- Source information preserved per channel
- Import history logging

### Intelligent Categorization
Channels are auto-mapped to dedicated sports sections using keyword rules:
- **Football** — Premier League, Champions League, La Liga, Serie A, Bundesliga, Ligue 1, MLS, Saudi Pro League, World Cup, AFC, Highlights, Replays
- **Cricket** — IPL, PSL, BBL, CPL, ICC Events, Asia Cup, Test, ODI, T20, Highlights, Classic Matches
- **Wrestling** — WWE RAW, SmackDown, NXT, AEW, UFC, PPV, WrestleMania, Royal Rumble, SummerSlam, Archives
- **Other Sports** — Basketball, Tennis, Baseball, F1, MotoGP, Boxing, MMA, Golf, Rugby, Ice Hockey, Olympics, Multi Sports

Admins can override any mapping manually.

### IPTV Player
- HLS / M3U8 support via hls.js
- Adaptive bitrate with quality selector (Auto + all levels)
- Playback speed control (0.5x – 2x)
- Custom control bar: play/pause, seek bar, volume slider, skip ±10s, jump to live
- Fullscreen, Picture-in-Picture
- Playback resume (saves position every 10s)
- Favorite + Notify-Me-on-Live buttons

### User Accounts
- Email/password signup with scrypt hashing
- User profile with stats (favorites, watched, subscribed, notifications)
- Favorites & watch history (synced across sessions)
- Channel notifications (get notified when a channel goes live)
- **100% free — no subscription fee, no paywall**

### Admin Panel (`?view=admin`)
- **Playlists** — add/edit/delete/refresh M3U sources, import history per playlist
- **Channels** — full table with search/filter, inline edit, bulk edit, remove duplicates, logo upload, stream probe
- **Categories** — view hierarchy, create custom categories (e.g. "PSL 2026", "Olympic Games")
- **Analytics** — 14 KPI cards, category bar chart, stream health pie, playlist health, buffer stats, recent activity, top channels
- **Revenue** — ad revenue dashboard with 14-day timeseries, revenue by source, top ad slots
- **Ads** — full CRUD for ad slots with CPM/CPC rates, live impressions/clicks/CTR
- **Settings** — refresh interval, geo-block, language, roles, EPG toggle

### SEO & Monetization
- Dynamic sitemap (`/sitemap.xml`) with all views + top 200 channels
- `robots.txt` + `manifest.webmanifest` (PWA)
- Open Graph, Twitter Cards, JSON-LD structured data
- Trending hashtags widget per category (copy-to-clipboard for social posts)
- Ad banner slots with automatic CPM/CPC revenue tracking
- Page-view tracking → RPM (revenue per mille) calculation

### URL Routing
All sections accessible via `?view=` query param (shareable, bookmarkable, SEO-indexed):
- `/?view=home` — Homepage with hero, rails, trending, recommended
- `/?view=live` — All live channels
- `/?view=football` / `cricket` / `wrestling` / `other-sports` — Category pages
- `/?view=search` — Global search with facets
- `/?view=favorites` / `history` / `profile` — User library
- `/?view=admin` — Admin panel

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Prisma ORM + SQLite (local) / MongoDB Atlas (production) |
| State | Zustand (client) + custom hooks (server) |
| Player | hls.js |
| Charts | Recharts |
| Icons | Lucide React |

## Getting Started

### Prerequisites
- Node.js 18+ / Bun
- An M3U playlist URL (or use the seeded demo playlists from iptv-org)

### Installation

```bash
# Install dependencies
bun install

# Set up the database
bun run db:push

# Start the dev server
bun run dev
```

Open `http://localhost:3000` — the platform auto-seeds 3 demo IPTV playlists and the category hierarchy on first load.

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./db/custom.db"
```

For production with MongoDB Atlas:
```env
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/playbeat"
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/playlists` | GET, POST | List / create M3U playlists |
| `/api/playlists/[id]` | PATCH, DELETE | Edit / delete a playlist |
| `/api/playlists/[id]/refresh` | POST | Manual refresh |
| `/api/playlists/[id]/history` | GET | Import history |
| `/api/channels` | GET | List channels (filters: category, subcategory, sourceId, liveNow, curated, q) |
| `/api/channels/[id]` | GET, PATCH, DELETE | Channel CRUD |
| `/api/channels/[id]/probe` | POST | Stream health check |
| `/api/channels/[id]/notify` | POST | Toggle live notification |
| `/api/channels/[id]/logo` | POST | Upload logo |
| `/api/channels/bulk` | POST | Bulk edit |
| `/api/channels/dedupe` | POST | Remove duplicates |
| `/api/categories` | GET, POST | Category hierarchy |
| `/api/favorites` | GET, POST | User favorites |
| `/api/history` | GET, POST | Watch history |
| `/api/continue-watching` | GET | Resume list |
| `/api/home` | GET | Aggregated homepage data |
| `/api/analytics` | GET | Dashboard metrics |
| `/api/search` | GET | Global search with facets |
| `/api/revenue` | GET | Revenue dashboard |
| `/api/ads` | GET, POST | Ad slot management |
| `/api/ads/serve` | GET | Serve an ad |
| `/api/ads/[id]/track` | POST | Track impression/click |
| `/api/subscriptions/plans` | GET | Subscription plans |
| `/api/auth/signup` | POST | Register |
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Current user |
| `/api/profile` | GET, PATCH | User profile |
| `/api/notifications` | GET, PATCH | Notifications |
| `/api/hashtags` | GET | Trending hashtags |
| `/api/import` | POST | Refresh all playlists |
| `/api/settings` | GET, POST | Platform settings |
| `/sitemap.xml` | GET | Dynamic sitemap |
| `/robots.txt` | GET | Robots |
| `/manifest.webmanifest` | GET | PWA manifest |

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com/new)
3. Set environment variables (`DATABASE_URL`)
4. Deploy

**Note**: For MongoDB Atlas, use a `mongodb+srv://` connection string (not the Atlas SQL format).

## License

MIT
