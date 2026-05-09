import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  await Task.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  const task = await Task.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(task);
}