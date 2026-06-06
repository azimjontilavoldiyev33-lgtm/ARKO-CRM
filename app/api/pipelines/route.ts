import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Pipeline from '@/models/Pipeline';
import Task from '@/models/Task';
import Order from '@/models/Order';
import Worker from '@/models/Worker';
import { notifyAll } from '@/lib/sse';
import { getAuth } from '@/lib/auth';

// populate('order'|'steps.worker') uchun modellar ro'yxatdan o'tishi shart
void [Order, Worker];

export async function GET() {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  await connectDB();
  const pipelines = await Pipeline.find({ company: auth.companyId })
    .populate('order', 'title')
    .populate('steps.worker', 'fullName')
    .sort({ createdAt: -1 });
  return NextResponse.json(pipelines);
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const company = auth.companyId;

  const pipeline = await Pipeline.create({
    title:       body.title,
    order:       body.order || null,
    steps:       body.steps,
    currentStep: 0,
    status:      'active',
    company,
  });

  // Birinchi bosqich uchun task yaratish
  const firstStep = body.steps[0];
  if (firstStep) {
    await Task.create({
      title:      firstStep.title,
      worker:     firstStep.worker,
      department: firstStep.department,
      deadline:   firstStep.deadline,
      order:      body.order || null,
      pipelineId: pipeline._id,
      stepIndex:  0,
      status:     'pending',
      company,
    });
  }
  notifyAll();
  return NextResponse.json(pipeline, { status: 201 });
}