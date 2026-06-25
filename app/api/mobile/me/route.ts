import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Attendance from '@/models/Attendance';
import Task from '@/models/Task';
import Company from '@/models/Company';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';

// populate('company') uchun Company modeli ro'yxatdan o'tishi shart
void Company;

// GET /api/mobile/me — ishchi profili + oylik statistikasi
export async function GET(req: NextRequest) {
  const workerId = await getWorkerIdFromRequest(req);
  if (!workerId) {
    return NextResponse.json({ success: false, message: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }

  await connectDB();

  const worker = await Worker.findById(workerId).populate('company', 'name');
  if (!worker) {
    return NextResponse.json({ success: false, message: 'Ishchi topilmadi' }, { status: 404 });
  }

  // Shu oy ishlangan kunlar (noyob check-in sanalari)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthAtt = await Attendance.find({ worker: workerId, checkIn: { $gte: monthStart } }).select('checkIn');
  const dayKeys = new Set(monthAtt.map((a) => new Date(a.checkIn).toISOString().slice(0, 10)));

  // Vazifa statistikasi
  const [completedTasks, activeTasks, ratedTasks] = await Promise.all([
    Task.countDocuments({ worker: workerId, status: 'completed' }),
    Task.countDocuments({ worker: workerId, status: { $ne: 'completed' } }),
    Task.find({ worker: workerId, status: 'completed', rating: { $ne: null } }).select('rating'),
  ]);
  const avgRating =
    ratedTasks.length > 0
      ? +(ratedTasks.reduce((s, t) => s + (t.rating ?? 0), 0) / ratedTasks.length).toFixed(1)
      : null;

  const companyName =
    worker.company && typeof worker.company === 'object' && 'name' in worker.company
      ? (worker.company as { name?: string }).name
      : null;

  return NextResponse.json({
    success: true,
    worker: {
      fullName: worker.fullName,
      phoneNumber: worker.phoneNumber,
      position: worker.position ?? null,
      code: worker.code ?? null,
      salary: worker.salary ?? 0,
      deviceBound: !!worker.deviceId,
      createdAt: worker.createdAt,
    },
    company: companyName,
    stats: {
      workDaysThisMonth: dayKeys.size,
      completedTasks,
      activeTasks,
      avgRating,
    },
  });
}
