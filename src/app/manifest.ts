import type { MetadataRoute } from 'next';

// GET /manifest.webmanifest — PWA manifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PlayBeat Arena — Live Sports Streaming',
    short_name: 'PlayBeat',
    description: 'Multi-M3U IPTV Sports Streaming Platform — Football, Cricket, WWE, UFC & more in HD.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#10b981',
    orientation: 'any',
    categories: ['sports', 'entertainment', 'video'],
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/android-chrome-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/logo.png', sizes: '1024x1024', type: 'image/png' },
    ],
    shortcuts: [
      { name: 'Live Now', url: '/?view=live', description: 'Channels streaming live now' },
      { name: 'Football', url: '/?view=football', description: 'Live football streams' },
      { name: 'Cricket', url: '/?view=cricket', description: 'Live cricket streams' },
      { name: 'Wrestling', url: '/?view=wrestling', description: 'WWE, UFC & wrestling' },
    ],
  };
}
