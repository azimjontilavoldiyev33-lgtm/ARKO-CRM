import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import Order from '@/models/Order';
import Worker from '@/models/Worker';
import Pipeline from '@/models/Pipeline';
import { notifyAll } from '@/lib/sse';

// populate('order'|'worker'|'pipelineId') ishlashi uchun bu modellar
// Mongoose'da ro'yxatdan o'tgan bo'lishi shart. Referans — tree-shaking
// import'ni o'chirib yubormasligi uchun.
void [Order, Worker, Pipeline];

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