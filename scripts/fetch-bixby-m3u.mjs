// Fetch M3U from Cloudflare-protected Xtream Codes server using Playwright.
// Solves the "Just a moment..." JS challenge by running a real Chromium with
// realistic settings, then captures the M3U response body + cf_clearance cookie.
//
// Usage: node scripts/fetch-bixby-m3u.mjs

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL = 'http://opplex.ch:8080/get.php?username=pas22333&password=ps334455&type=m3u_plus';
const OUT_M3U = '/tmp/bixby.m3u';
const OUT_COOKIES = '/tmp/bixby-cookies.json';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });

  // Hide automation signals so Cloudflare's bot detection lets us through.
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    const orig = navigator.permissions.query;
    navigator.permissions.query = (params) =>
      params.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : orig(params);
  });

  const page = await context.newPage();

  console.log('→ Navigating to M3U URL (Cloudflare challenge expected)...');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('→ Waiting for Cloudflare challenge to resolve (up to 90s)...');
  for (let i = 0; i < 18; i++) {
    await page.waitForTimeout(5000);
    const title = await page.title();
    const bodyLen = await page.evaluate(() => document.body.innerText.length);
    console.log(`  t=${(i + 1) * 5}s title="${title}" bodyLen=${bodyLen}`);
    if (!title.includes('Just a moment')) {
      console.log('  ✓ Challenge cleared!');
      break;
    }
  }

  const content = await page.evaluate(() => document.body.innerText);
  const title = await page.title();

  console.log(`\n→ Final title: "${title}"`);
  console.log(`→ Content length: ${content.length}`);

  if (content.startsWith('#EXTM3U') || content.includes('#EXTINF')) {
    writeFileSync(OUT_M3U, content, 'utf-8');
    const extinfCount = (content.match(/^#EXTINF/gm) || []).length;
    console.log(`✓ SAVED M3U to ${OUT_M3U}`);
    console.log(`✓ Channel count: ${extinfCount}`);

    const cookies = await context.cookies();
    writeFileSync(OUT_COOKIES, JSON.stringify(cookies, null, 2));
    console.log(`✓ Saved ${cookies.length} cookies to ${OUT_COOKIES}`);
    const cfClearance = cookies.find((c) => c.name === 'cf_clearance');
    console.log(`  cf_clearance: ${cfClearance ? 'found' : 'not found'}`);
  } else {
    console.log('✗ Content is not an M3U playlist. First 300 chars:');
    console.log(content.slice(0, 300));
    writeFileSync(OUT_M3U + '.debug.txt', content, 'utf-8');
  }

  await browser.close();
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
