import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import Pipeline from '@/models/Pipeline';
import { notifyAll } from '@/lib/sse';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  await Task.findByIdAndDelete(id);
  notifyAll();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const body = await req.json();

  const task = await Task.findByIdAndUpdate(id, body, { new: true });
  notifyAll();

  // Pipeline logikasi — status completed bo'lganda
  if (body.status === 'completed' && task?.pipelineId != null) {
    const pipeline = await Pipeline.findById(task.pipelineId);

    if (pipeline && pipeline.status === 'active') {
      const nextIndex = (task.stepIndex ?? 0) + 1;

      if (nextIndex < pipeline.steps.length) {
        // Keyingi bosqich bor — yangi task yaratish
        const nextStep = pipeline.steps[nextIndex];

        await Task.create({
          title:      nextStep.title,
          worker:     nextStep.worker,
          department: nextStep.department,
          deadline:   nextStep.deadline,
          order:      task.order || null,
          pipelineId: pipeline._id,
          stepIndex:  nextIndex,
          status:     'pending',
        });

        // Pipeline currentStep yangilash
        await Pipeline.findByIdAndUpdate(pipeline._id, { currentStep: nextIndex });
        notifyAll();
      } else {
        // Barcha bosqichlar tugadi
        await Pipeline.findByIdAndUpdate(pipeline._id, { status: 'completed' });
      }
    }
  }

  return NextResponse.json(task);
}