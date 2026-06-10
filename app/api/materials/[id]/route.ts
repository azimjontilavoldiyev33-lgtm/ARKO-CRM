import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Material from '@/models/Material';
import StockMovement from '@/models/StockMovement';
import { getAuth } from '@/lib/auth';

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// PATCH /api/materials/[id] — material ma'lumotini tahrirlash (qoldiq EMAS — u faqat kirim/chiqim orqali)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.unit !== undefined) update.unit = String(body.unit).trim() || 'dona';
  if (body.minQuantity !== undefined) update.minQuantity = Math.max(0, num(body.minQuantity));
  if (body.price !== undefined) update.price = Math.max(0, Math.round(num(body.price)));

  const material = await Material.findOneAndUpdate({ _id: id, company: auth.companyId }, update, { new: true });
  if (!material) return NextResponse.json({ error: 'Material topilmadi' }, { status: 404 });
  return NextResponse.json(material);
}

// DELETE /api/materials/[id] — material + uning barcha harakatlarini o'chirish
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  const { id } = await params;
  await connectDB();
  await Material.findOneAndDelete({ _id: id, company: auth.companyId });
  await StockMovement.deleteMany({ company: auth.companyId, material: id });
  return NextResponse.json({ ok: true });
}
