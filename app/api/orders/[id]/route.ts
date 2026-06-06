import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { getAuth } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  await Order.findOneAndDelete({ _id: id, company: auth.companyId });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  const order = await Order.findOneAndUpdate({ _id: id, company: auth.companyId }, body, { new: true });
  return NextResponse.json(order);
}