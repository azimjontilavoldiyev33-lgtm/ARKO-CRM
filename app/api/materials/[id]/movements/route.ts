import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Material from '@/models/Material';
import StockMovement from '@/models/StockMovement';
import Transaction from '@/models/Transaction';
import { getAuth } from '@/lib/auth';

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// GET /api/materials/[id]/movements — material harakatlari tarixi (oxirgisi birinchi)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const movements = await StockMovement.find({ company: auth.companyId, material: id }).sort({ date: -1 }).limit(100);
  return NextResponse.json(movements);
}

// POST /api/materials/[id]/movements — kirim (in) yoki chiqim (out). Qoldiq atomik o'zgaradi.
// Ixtiyoriy: kirimda expenseAmount > 0 bo'lsa Hisobotlar ledger'iga 'material' xarajati yoziladi.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const body = await req.json();

  const type = body.type === 'in' ? 'in' : body.type === 'out' ? 'out' : null;
  const quantity = num(body.quantity);
  if (!type) return NextResponse.json({ error: 'Tur noto\'g\'ri (in/out)' }, { status: 400 });
  if (!(quantity > 0)) return NextResponse.json({ error: 'Miqdor noto\'g\'ri' }, { status: 400 });

  // Qoldiqni atomik o'zgartiramiz. Chiqimda yetarli qoldiq bo'lishi shart (poyga-xavfsiz shart).
  const material = type === 'in'
    ? await Material.findOneAndUpdate({ _id: id, company: auth.companyId }, { $inc: { quantity } }, { new: true })
    : await Material.findOneAndUpdate({ _id: id, company: auth.companyId, quantity: { $gte: quantity } }, { $inc: { quantity: -quantity } }, { new: true });

  if (!material) {
    // Material topilmadi YOKI chiqim uchun qoldiq yetarli emas — qaysi ekanini aniqlaymiz
    const exists = await Material.findOne({ _id: id, company: auth.companyId }).select('quantity');
    if (!exists) return NextResponse.json({ error: 'Material topilmadi' }, { status: 404 });
    return NextResponse.json({ error: `Qoldiq yetarli emas (mavjud: ${exists.quantity})` }, { status: 400 });
  }

  await StockMovement.create({
    company: auth.companyId,
    material: material._id,
    type,
    quantity,
    note: (body.note || '').trim(),
    date: body.date ? new Date(body.date) : new Date(),
  });

  // Opsiyonel: material xaridini Hisobotlar xarajatiga yozish
  const expenseAmount = Math.round(num(body.expenseAmount));
  if (type === 'in' && expenseAmount > 0) {
    await Transaction.create({
      company: auth.companyId,
      type: 'expense',
      category: 'material',
      amount: expenseAmount,
      note: material.name + (body.note ? ` · ${String(body.note).trim()}` : ''),
      date: body.date ? new Date(body.date) : new Date(),
    });
  }

  return NextResponse.json({ ok: true, quantity: material.quantity }, { status: 201 });
}
