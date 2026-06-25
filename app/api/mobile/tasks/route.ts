import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import Order from '@/models/Order';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';

// populate('order') uchun Order modeli ro'yxatdan o'tishi shart
void Order;

// GET /api/mobile/tasks — kirgan ishchining faol (tugallanmagan) vazifalari
export async function GET(req: NextRequest) {
  const workerId = await getWorkerIdFromRequest(req);
  if (!workerId) {
    return NextResponse.json(
      { success: false, message: 'Avtorizatsiya talab qilinadi' },
      { status: 401 }
    );
  }

  await connectDB();

  const tasks = await Task.find({ worker: workerId, status: { $ne: 'completed' } })
    .populate('order', 'title')
    // in_progress ('i') pending ('p') dan oldin keladi → jarayondagilar yuqorida
    .sort({ status: 1, deadline: 1 });

  return NextResponse.json({ success: true, data: tasks });
}
