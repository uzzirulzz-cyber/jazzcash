import { db } from '../src/lib/db';

async function main() {
  const playlists = await db.playlist.findMany({
    select: { id: true, name: true, url: true, status: true, channelCount: true, enabled: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log('=== ALL PLAYLISTS ===');
  for (const p of playlists) {
    console.log(`\nID: ${p.id}`);
    console.log(`Name: ${p.name}`);
    console.log(`URL: ${p.url}`);
    console.log(`Status: ${p.status} | Enabled: ${p.enabled} | Channels: ${p.channelCount}`);
    console.log(`Created: ${p.createdAt.toISOString()}`);
  }
  console.log(`\n=== TOTAL: ${playlists.length} playlists ===`);

  const totalChannels = await db.channel.count();
  console.log(`Total channels in DB: ${totalChannels}`);
}

main().catch(console.error).finally(() => process.exit(0));
