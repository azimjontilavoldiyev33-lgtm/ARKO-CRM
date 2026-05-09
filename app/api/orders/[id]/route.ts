import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  await Order.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  const order = await Order.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(order);
}