// Generate a proper multi-resolution favicon.ico from the new Stream2Arena logo.
// Uses the PNG-in-ICO format (supported by all modern browsers since Vista).
//
// Usage: node scripts/gen-favicon-ico.mjs

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const logoSvg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <circle cx="24" cy="24" r="22.5" stroke="url(#ring)" stroke-width="1.5" fill="url(#bg)" />
  <circle cx="24" cy="24" r="19.5" stroke="#ffffff" stroke-opacity="0.06" stroke-width="0.75" fill="none" />
  <path d="M30.5 17.2c-1.3-1.7-3.5-2.7-6.3-2.7-3.9 0-6.7 2-6.7 5.1 0 2.7 1.9 4.1 5.6 4.9l2.1 0.45c2.3 0.5 3.2 1.1 3.2 2.3 0 1.4-1.3 2.3-3.5 2.3-2.4 0-3.9-1-4.5-2.8l-3.6 1.4c1.1 3.2 3.9 4.8 8 4.8 4.3 0 7.3-2.1 7.3-5.5 0-2.9-1.8-4.3-5.9-5.2l-2.1-0.46c-2.1-0.47-3-1-3-2.2 0-1.3 1.2-2.1 3.1-2.1 1.9 0 3.2 0.78 3.9 2.2l3.4-1.5z" fill="url(#sglyph)" />
  <circle cx="34.5" cy="13.5" r="3" fill="#10b981" />
</svg>`;

async function pngForSize(size) {
  return sharp(Buffer.from(logoSvg, 'utf-8'), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 92, compressionLevel: 9 })
    .toBuffer();
}

// Build a multi-image ICO file containing PNG entries.
// Format: ICONDIR(6) + N*ICONDIRENTRY(16) + N*PNGDATA
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let totalSize = headerSize;
  for (const b of pngBuffers) totalSize += b.length;

  const buf = Buffer.alloc(totalSize);
  let o = 0;
  // ICONDIR
  buf.writeUInt16LE(0, o); o += 2;      // reserved
  buf.writeUInt16LE(1, o); o += 2;      // type = 1 (icon)
  buf.writeUInt16LE(count, o); o += 2;  // image count

  let dataOffset = headerSize;
  for (let i = 0; i < count; i++) {
    const png = pngBuffers[i];
    const size = png.length;
    // ICONDIRENTRY
    buf.writeUInt8(0, o); o += 1;              // width (0 = 256)
    buf.writeUInt8(0, o); o += 1;              // height (0 = 256)
    buf.writeUInt8(0, o); o += 1;              // color count (0 = >=256)
    buf.writeUInt8(0, o); o += 1;              // reserved
    buf.writeUInt16LE(1, o); o += 2;           // planes
    buf.writeUInt16LE(32, o); o += 2;          // bpp
    buf.writeUInt32LE(size, o); o += 4;        // image size
    buf.writeUInt32LE(dataOffset, o); o += 4;  // offset to image data
    dataOffset += size;
  }

  for (const png of pngBuffers) {
    png.copy(buf, o);
    o += png.length;
  }

  return buf;
}

async function main() {
  // Multi-resolution: 16, 32, 48 (standard favicon sizes)
  const sizes = [16, 32, 48];
  const pngs = [];
  for (const s of sizes) pngs.push(await pngForSize(s));
  const ico = buildIco(pngs);
  const out = join(PUBLIC_DIR, 'favicon.ico');
  writeFileSync(out, ico);
  console.log('✓', out, `(${ico.length} bytes, ${sizes.length} sizes)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
