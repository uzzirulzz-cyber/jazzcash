import type { MetadataRoute } from 'next';

// GET /manifest.webmanifest — PWA manifest (Android-installable)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PlayBeat Arena — Live Sports, Movies & Music',
    short_name: 'PlayBeat Arena',
    description: 'Watch 14,000+ live sports, movies, music & web series channels free. Football, Cricket, WWE, UFC, Bollywood, Hollywood & more in HD.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'fullscreen', 'minimal-ui'],
    background_color: '#0a0a0a',
    theme_color: '#10b981',
    orientation: 'portrait-primary',
    categories: ['sports', 'entertainment', 'video', 'music', 'movies'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: false,
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { src: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/android-chrome-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/android-chrome-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/logo.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Live Now', short_name: 'Live', url: '/?view=live&source=shortcut', description: 'Channels streaming live now' },
      { name: 'Football', short_name: 'Football', url: '/?view=football&source=shortcut', description: 'Live football streams' },
      { name: 'Cricket', short_name: 'Cricket', url: '/?view=cricket&source=shortcut', description: 'Live cricket streams' },
      { name: 'Movies', short_name: 'Movies', url: '/?view=movies&source=shortcut', description: 'Movie channels' },
      { name: 'Music', short_name: 'Music', url: '/?view=music&source=shortcut', description: 'Music channels' },
    ],
  };
}
