import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/categories/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.keywords === 'string') data.keywords = body.keywords;
  if (typeof body.icon === 'string') data.icon = body.icon;
  if (typeof body.color === 'string') data.color = body.color;
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
  const cat = await db.sportsCategory.update({ where: { id }, data });
  return NextResponse.json({ category: cat });
}

// DELETE /api/categories/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.sportsCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
