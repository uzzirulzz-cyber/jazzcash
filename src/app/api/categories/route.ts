import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/categories — full hierarchy
export async function GET() {
  const all = await db.sportsCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  const tops = all.filter((c) => !c.parentId);
  const tree = tops.map((t) => ({
    ...t,
    children: all
      .filter((c) => c.parentId === t.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
  return NextResponse.json({ categories: tree });
}

// POST /api/categories — create a custom category
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const slug = (body.slug || name.toLowerCase().replace(/\s+/g, '-')).trim();
  const existing = await db.sportsCategory.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: 'slug already in use' }, { status: 400 });

  const cat = await db.sportsCategory.create({
    data: {
      name,
      slug,
      parentId: body.parentId || null,
      icon: body.icon || 'Medal',
      color: body.color || 'text-violet-500',
      keywords: String(body.keywords || ''),
      isCustom: true,
      sortOrder: Number(body.sortOrder) || 99,
    },
  });
  return NextResponse.json({ category: cat }, { status: 201 });
}
