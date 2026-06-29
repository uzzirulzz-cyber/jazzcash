import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/products — list active products
export async function GET() {
  const products = await db.product.findMany({ where: { active: true }, orderBy: [{ featured: 'desc' }, { salesCount: 'desc' }] });
  return NextResponse.json({ products });
}

// POST /api/products — create product
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const product = await db.product.create({
    data: {
      name,
      description: body.description || null,
      type: body.type || 'iptv_sub',
      priceCents: Number(body.priceCents) || 0,
      oldPriceCents: body.oldPriceCents ? Number(body.oldPriceCents) : null,
      imageUrl: body.imageUrl || null,
      downloadUrl: body.downloadUrl || null,
      featured: !!body.featured,
    },
  });
  return NextResponse.json({ product }, { status: 201 });
}
