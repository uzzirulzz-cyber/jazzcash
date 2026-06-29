// Generate all Stream2Arena logo PNG assets from a single SVG design.
// The SVG matches the inline BrandLogo React component (circular dark badge,
// stylized white "S", emerald ring + live dot).
//
// Outputs to /public:
//   - logo.png (1024x1024)
//   - apple-touch-icon.png (180x180, solid bg for iOS)
//   - android-chrome-192.png (192x192)
//   - android-chrome-512.png (512x512)
//   - favicon-16.png, favicon-32.png
//   - og-image.png (1200x630 — logo on dark gradient with wordmark)
//
// Usage: node scripts/gen-logo-assets.mjs

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// --- Logo SVG (matches src/components/brand-logo.tsx) -------------------------
function logoSvg(size, { solidBg = false } = {}) {
  const s = size;
  return `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="70%">
      <stop offset="0%" stop-color="#161616" />
      <stop offset="100%" stop-color="#050505" />
    </radialGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="sglyph" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e6fff5" />
    </linearGradient>
  </defs>
  ${solidBg ? `<rect width="48" height="48" fill="#050505" />` : ''}
  <circle cx="24" cy="24" r="22.5" stroke="url(#ring)" stroke-width="1.5" fill="url(#bg)" />
  <circle cx="24" cy="24" r="19.5" stroke="#ffffff" stroke-opacity="0.06" stroke-width="0.75" fill="none" />
  <path d="M30.5 17.2c-1.3-1.7-3.5-2.7-6.3-2.7-3.9 0-6.7 2-6.7 5.1 0 2.7 1.9 4.1 5.6 4.9l2.1 0.45c2.3 0.5 3.2 1.1 3.2 2.3 0 1.4-1.3 2.3-3.5 2.3-2.4 0-3.9-1-4.5-2.8l-3.6 1.4c1.1 3.2 3.9 4.8 8 4.8 4.3 0 7.3-2.1 7.3-5.5 0-2.9-1.8-4.3-5.9-5.2l-2.1-0.46c-2.1-0.47-3-1-3-2.2 0-1.3 1.2-2.1 3.1-2.1 1.9 0 3.2 0.78 3.9 2.2l3.4-1.5z" fill="url(#sglyph)" />
  <circle cx="34.5" cy="13.5" r="3" fill="#10b981" />
</svg>`;
}

// --- OG image SVG (1200x630) --------------------------------------------------
function ogImageSvg() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ogbg1" cx="30%" cy="0%" r="70%">
      <stop offset="0%" stop-color="#0d2a20" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="ogbg2" cx="100%" cy="100%" r="60%">
      <stop offset="0%" stop-color="#2a0d0d" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="ogring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="ogs" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e6fff5" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0a0a0a" />
  <rect width="1200" height="630" fill="url(#ogbg1)" />
  <rect width="1200" height="630" fill="url(#ogbg2)" />

  <!-- Logo badge (scaled up, left of wordmark) -->
  <g transform="translate(120, 215)">
    <circle cx="100" cy="100" r="94" stroke="url(#ogring)" stroke-width="6" fill="#0d0d0d" />
    <circle cx="100" cy="100" r="82" stroke="#ffffff" stroke-opacity="0.06" stroke-width="3" fill="none" />
    <path transform="translate(8, 8) scale(3.846)" d="M30.5 17.2c-1.3-1.7-3.5-2.7-6.3-2.7-3.9 0-6.7 2-6.7 5.1 0 2.7 1.9 4.1 5.6 4.9l2.1 0.45c2.3 0.5 3.2 1.1 3.2 2.3 0 1.4-1.3 2.3-3.5 2.3-2.4 0-3.9-1-4.5-2.8l-3.6 1.4c1.1 3.2 3.9 4.8 8 4.8 4.3 0 7.3-2.1 7.3-5.5 0-2.9-1.8-4.3-5.9-5.2l-2.1-0.46c-2.1-0.47-3-1-3-2.2 0-1.3 1.2-2.1 3.1-2.1 1.9 0 3.2 0.78 3.9 2.2l3.4-1.5z" fill="url(#ogs)" />
    <circle cx="144" cy="56" r="12" fill="#10b981" />
  </g>

  <!-- Wordmark -->
  <text x="380" y="290" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="900" fill="#ffffff" letter-spacing="-2">Stream2Arena</text>
  <text x="386" y="345" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#34d399" letter-spacing="8">LIVE SPORTS &amp; TV</text>

  <!-- Subtitle -->
  <text x="384" y="430" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="400" fill="#a8a8a8">14,000+ live channels · Football · Cricket · WWE · Movies · Music · 100% Free</text>
</svg>`;
}

async function render(svgStr, outPath, size) {
  const buf = Buffer.from(svgStr, 'utf-8');
  await sharp(buf, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(outPath);
  console.log('✓', outPath);
}

async function renderOg(svgStr, outPath) {
  const buf = Buffer.from(svgStr, 'utf-8');
  await sharp(buf, { density: 144 })
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(outPath);
  console.log('✓', outPath);
}

async function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });

  await render(logoSvg(1024), join(PUBLIC_DIR, 'logo.png'), 1024);
  await render(logoSvg(512), join(PUBLIC_DIR, 'android-chrome-512.png'), 512);
  await render(logoSvg(192), join(PUBLIC_DIR, 'android-chrome-192.png'), 192);
  await render(logoSvg(32), join(PUBLIC_DIR, 'favicon-32.png'), 32);
  await render(logoSvg(16), join(PUBLIC_DIR, 'favicon-16.png'), 16);
  await render(logoSvg(180, { solidBg: true }), join(PUBLIC_DIR, 'apple-touch-icon.png'), 180);
  await renderOg(ogImageSvg(), join(PUBLIC_DIR, 'og-image.png'));

  console.log('\nAll logo assets generated in /public');
}

main().catch((e) => { console.error(e); process.exit(1); });
