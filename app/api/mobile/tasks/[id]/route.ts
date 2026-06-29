import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';
import { notifyAll } from '@/lib/sse';
import { advancePipelineOnComplete } from '@/lib/taskFlow';

// PATCH /api/mobile/tasks/[id] — ishchi o'z vazifasini boshlaydi/tugatadi
// body: { action: 'start' | 'complete' }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const workerId = await getWorkerIdFromRequest(req);
  if (!workerId) {
    return NextResponse.json(
      { success: false, message: 'Avtorizatsiya talab qilinadi' },
      { status: 401 }
    );
  }

  const { id } = await params;
  await connectDB();
  const { action, completionPhoto } = await req.json();

  // Faqat O'Z vazifasini o'zgartira oladi
  const task = await Task.findOne({ _id: id, worker: workerId });
  if (!task) {
    return NextResponse.json({ success: false, message: 'Vazifa topilmadi' }, { status: 404 });
  }

  if (action === 'start') {
    task.status = 'in_progress';
    task.startedAt = new Date();
  } else if (action === 'complete') {
    task.status = 'completed';
    task.completedAt = new Date();
    if (completionPhoto) task.completionPhoto = completionPhoto; // ish isboti rasmi
  } else {
    return NextResponse.json({ success: false, message: "Noto'g'ri amal" }, { status: 400 });
  }

  await task.save();
  notifyAll(); // monitor real-time yangilanadi

  if (action === 'complete') {
    await advancePipelineOnComplete(task);
  }

  return NextResponse.json({ success: true, data: task });
}
