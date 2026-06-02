import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import { notifyAll } from '@/lib/sse';

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const workerId = searchParams.get('worker');
  const department = searchParams.get('department');

  const query: Record<string, any> = {};
  if (workerId) query.worker = workerId;
  if (department) query.department = department;

  const tasks = await Task.find(query)
    .populate('order', 'title')
    .populate('worker', 'fullName')
      .populate('pipelineId', 'title steps currentStep status')  
    .sort({ createdAt: -1 });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  try {
    const task = await Task.create(body);
    notifyAll();
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('Task yaratishda xato:', err);
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}