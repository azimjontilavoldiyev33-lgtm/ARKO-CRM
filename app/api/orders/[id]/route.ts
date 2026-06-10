import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';
import { getAuth } from '@/lib/auth';
import { reconcileOrderIncome } from '@/lib/orderIncome';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  const { id } = await params;
  await connectDB();
  await Order.findOneAndDelete({ _id: id, company: auth.companyId });
  // Buyurtmaga bog'langan avtomatik daromad yozuvini ham tozalaymiz (orphan qolmasin)
  await Transaction.deleteMany({ company: auth.companyId, order: id });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  if (body.amount !== undefined) {
    const n = Math.round(Number(body.amount));
    body.amount = Number.isFinite(n) && n > 0 ? n : 0;
  }
  const order = await Order.findOneAndUpdate({ _id: id, company: auth.companyId }, body, { new: true });
  // Status/narx o'zgarishiga qarab avtomatik daromad yozuvini sinxronlaymiz
  if (order) await reconcileOrderIncome(auth.companyId, order);
  return NextResponse.json(order);
}
