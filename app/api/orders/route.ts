import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { getAuth } from '@/lib/auth';
import { reconcileOrderIncome } from '@/lib/orderIncome';

// Narxni butun musbat songa keltiradi (noto'g'ri/bo'sh = 0)
function sanitizeAmount(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function GET() {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();
  const orders = await Order.find({ company: auth.companyId }).sort({ createdAt: -1 });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();
  const body = await req.json();
  if (body.amount !== undefined) body.amount = sanitizeAmount(body.amount);
  try {
    const order = await Order.create({ ...body, company: auth.companyId });
    // Buyurtma to'g'ridan-to'g'ri "completed" yaratilsa ham daromad yoziladi (UI odatda "new" yaratadi)
    await reconcileOrderIncome(auth.companyId, order);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}