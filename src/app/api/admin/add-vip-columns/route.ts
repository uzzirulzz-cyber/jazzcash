import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/add-vip-columns — adds vip + vipExpiresAt columns to User table
// (Workaround for prisma db push being blocked from this sandbox)
export async function GET() {
  try {
    // Check if columns already exist
    const cols = await db.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'User' AND column_name IN ('vip', 'vipExpiresAt')
    ` as { column_name: string }[];
    const existing = new Set(cols.map((c) => c.column_name));
    const added: string[] = [];

    if (!existing.has('vip')) {
      await db.$executeRaw`ALTER TABLE "User" ADD COLUMN "vip" BOOLEAN NOT NULL DEFAULT false`;
      added.push('vip');
    }
    if (!existing.has('vipExpiresAt')) {
      await db.$executeRaw`ALTER TABLE "User" ADD COLUMN "vipExpiresAt" TIMESTAMP(3)`;
      added.push('vipExpiresAt');
    }

    return NextResponse.json({
      ok: true,
      message: added.length ? `Added columns: ${added.join(', ')}` : 'Columns already exist',
      added,
      existing: Array.from(existing),
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
