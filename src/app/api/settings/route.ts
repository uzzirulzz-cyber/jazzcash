import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/settings
export async function GET() {
  const rows = await db.setting.findMany();
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json({ settings });
}

// POST /api/settings — upsert key/value
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const ops = Object.entries(body).map(([key, value]) =>
    db.setting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    }),
  );
  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}
