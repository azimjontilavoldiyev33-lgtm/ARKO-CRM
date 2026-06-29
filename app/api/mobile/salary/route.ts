import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Attendance from '@/models/Attendance';
import Task from '@/models/Task';
import Company from '@/models/Company';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';

const WORK_HOURS = 8;
const LUNCH = 1;
const TASH = 5 * 60 * 60 * 1000; // UTC+5

function tashDay(d: Date): number {
  return new Date(d.getTime() + TASH).getUTCDate();
}
function workDaysInMonth(year: number, month: number): number {
  const days = new Date(year, month, 0).getDate();
  let c = 0;
  for (let d = 1; d <= days; d++) if (new Date(year, month - 1, d).getDay() !== 0) c++;
  return c;
}

// GET /api/mobile/salary?month=&year=  (default — joriy oy)
// Admin salary/sheet bilan bir xil formula, lekin faqat kirgan ishchi uchun.
export async function GET(req: NextRequest) {
  const workerId = await getWorkerIdFromRequest(req);
  if (!workerId) {
    return NextResponse.json({ success: false, message: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }

  await connectDB();
  const worker = await Worker.findById(workerId).select('salary company fullName');
  if (!worker) {
    return NextResponse.json({ success: false, message: 'Ishchi topilmadi' }, { status: 404 });
  }

  const now = new Date();
  const month = parseInt(new URL(req.url).searchParams.get('month') || '') || now.getMonth() + 1;
  const year = parseInt(new URL(req.url).searchParams.get('year') || '') || now.getFullYear();

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const totalWorkDays = workDaysInMonth(year, month);

  const company = await Company.findById(worker.company).select('pointValue');
  const pointValue = company?.pointValue || 0;

  // Davomat — kun bo'yicha (overtime bilan)
  const records = await Attendance.find({ worker: workerId, checkIn: { $gte: from, $lt: to } });
  const dayMap: Record<number, number> = {}; // kun -> overtime daqiqa
  for (const r of records) {
    const day = tashDay(new Date(r.checkIn));
    let otMin = 0;
    if (r.checkOut) {
      const net = (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000 - LUNCH;
      if (net > WORK_HOURS) otMin = (net - WORK_HOURS) * 60;
    }
    dayMap[day] = (dayMap[day] || 0) + otMin;
  }
  const workDays = Object.keys(dayMap).length;
  const otMin = Object.values(dayMap).reduce((s, m) => s + m, 0);

  // Ball — shu oy bajarilgan vazifalar (o'z vaqtida +1, kechikkan −1)
  const tasks = await Task.find({ worker: workerId, status: 'completed', completedAt: { $gte: from, $lt: to } }).select('deadline completedAt');
  let onTime = 0, late = 0;
  for (const t of tasks) {
    if (t.completedAt && t.deadline) {
      if (new Date(t.completedAt) <= new Date(t.deadline)) onTime++; else late++;
    }
  }
  const points = onTime - late;

  const base = worker.salary || 0;
  const hourlyRate = totalWorkDays > 0 ? base / (totalWorkDays * WORK_HOURS) : 0;
  const baseEarned = Math.round(hourlyRate * WORK_HOURS * workDays);
  const overtimePay = Math.round((otMin / 60) * hourlyRate);
  const pointBonus = Math.round(points * pointValue);
  const totalSalary = baseEarned + overtimePay + pointBonus;

  return NextResponse.json({
    success: true,
    month, year,
    salary: base,
    workDays, totalWorkDays,
    overtimeHours: +(otMin / 60).toFixed(1),
    baseEarned, overtimePay,
    points, pointBonus,
    totalSalary,
  });
}
