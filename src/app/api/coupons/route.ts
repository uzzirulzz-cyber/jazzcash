import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/coupons — list active coupons
export async function GET() {
  const coupons = await db.coupon.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ coupons });
}

// POST /api/coupons — create coupon
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? '').trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const coupon = await db.coupon.create({
    data: {
      code,
      type: body.type || 'percent',
      value: Number(body.value) || 0,
      appliesTo: body.appliesTo || 'all',
      maxUses: Number(body.maxUses) || 100,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });
  return NextResponse.json({ coupon }, { status: 201 });
}
