import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function GET() {
  await connectDB();
  const workers = await Worker.find().sort({ createdAt: -1 });
  return NextResponse.json(workers);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  try {
    const worker = await Worker.create(body);
    return NextResponse.json(worker, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Bu telefon raqam allaqachon mavjud' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}