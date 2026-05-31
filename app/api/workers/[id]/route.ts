import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  // code orqali qidirish (4 xonali raqam bo'lsa)
  if (/^\d{4}$/.test(id)) {
    const worker = await Worker.findOne({ code: id });
    if (!worker) return NextResponse.json({ error: 'Ishchi topilmadi' }, { status: 404 });
    return NextResponse.json(worker);
  }

  const worker = await Worker.findById(id);
  if (!worker) return NextResponse.json({ error: 'Ishchi topilmadi' }, { status: 404 });
  return NextResponse.json(worker);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  await Worker.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  const worker = await Worker.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(worker);
}