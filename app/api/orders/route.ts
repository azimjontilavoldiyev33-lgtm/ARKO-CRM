import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { getDefaultCompanyId } from '@/lib/company';

export async function GET() {
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  try {
    const company = await getDefaultCompanyId();
    const order = await Order.create({ ...body, company });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}