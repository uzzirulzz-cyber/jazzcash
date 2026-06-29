import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/memberships — list active membership plans
export async function GET() {
  const plans = await db.membershipPlan.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  return NextResponse.json({ plans });
}

// POST /api/memberships — create/update plan
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  const tier = String(body.tier ?? '').trim();
  if (!name || !tier) return NextResponse.json({ error: 'name and tier required' }, { status: 400 });

  const existing = await db.membershipPlan.findUnique({ where: { tier } });
  if (existing) {
    const updated = await db.membershipPlan.update({
      where: { id: existing.id },
      data: {
        name,
        priceCents: Number(body.priceCents) || 0,
        interval: body.interval || 'month',
        features: body.features || '',
        popular: !!body.popular,
        active: body.active !== false,
      },
    });
    return NextResponse.json({ plan: updated });
  }

  const plan = await db.membershipPlan.create({
    data: {
      name,
      tier,
      priceCents: Number(body.priceCents) || 0,
      interval: body.interval || 'month',
      features: body.features || '',
      popular: !!body.popular,
      sortOrder: Number(body.sortOrder) || 0,
    },
  });
  return NextResponse.json({ plan }, { status: 201 });
}
