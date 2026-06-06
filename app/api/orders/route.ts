import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { getAuth } from '@/lib/auth';

export async function GET() {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  await connectDB();
  const orders = await Order.find({ company: auth.companyId }).sort({ createdAt: -1 });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  try {
    const order = await Order.create({ ...body, company: auth.companyId });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}