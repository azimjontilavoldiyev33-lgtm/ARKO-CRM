import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Task from '@/models/Task';
import Attendance from '@/models/Attendance';
import { getAuth } from '@/lib/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

const WORK_HOURS = 8;            // standart ish kuni
const LUNCH = 1;                 // obed (soat)
const TASH = 5 * 60 * 60 * 1000; // UTC+5 (Toshkent)

// Toshkent sanasi (YYYY-MM-DD) — kunlarni guruhlash uchun (Vercel UTC)
function tashDateStr(d: Date): string {
  return new Date(d.getTime() + TASH).toISOString().slice(0, 10);
}

// Davr boshlanish vaqti
function rangeFrom(period: string): Date {
  if (period === 'all') return new Date(0);
  if (period === '30d') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // 'month' (default) — joriy oy boshi (Toshkent)
  const t = new Date(Date.now() + TASH);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1) - TASH);
}

// GET /api/kpi?period=month|30d|all — Pro-only, korxona bo'yicha usta KPI
export async function GET(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month';
  const from = rangeFrom(period);

  const [workers, tasks, records] = await Promise.all([
    Worker.find({ company: auth.companyId }).select('fullName position').sort({ fullName: 1 }),
    Task.find({ company: auth.companyId, createdAt: { $gte: from } }).select('worker status deadline completedAt rating'),
    Attendance.find({ company: auth.companyId, checkIn: { $gte: from } }).select('worker checkIn checkOut'),
  ]);

  // Vazifa metrikalari (worker bo'yicha)
  const tMap: Record<string, any> = {};
  for (const t of tasks as any[]) {
    const wid = String(t.worker);
    const m = (tMap[wid] ??= { completed: 0, inProgress: 0, pending: 0, onTime: 0, ratingSum: 0, ratingCount: 0 });
    if (t.status === 'completed') {
      m.completed++;
      if (t.completedAt && t.deadline && new Date(t.completedAt) <= new Date(t.deadline)) m.onTime++;
      if (typeof t.rating === 'number') { m.ratingSum += t.rating; m.ratingCount++; }
    } else if (t.status === 'in_progress') {
      m.inProgress++;
    } else {
      m.pending++;
    }
  }

  // Davomat metrikalari (worker bo'yicha)
  const aMap: Record<string, { dates: Set<string>; netHours: number; otMin: number }> = {};
  for (const r of records as any[]) {
    const wid = String(r.worker);
    const a = (aMap[wid] ??= { dates: new Set<string>(), netHours: 0, otMin: 0 });
    a.dates.add(tashDateStr(new Date(r.checkIn)));
    if (r.checkOut) {
      const gross = (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 3600000;
      const net = Math.max(0, gross - LUNCH);
      a.netHours += net;
      if (net > WORK_HOURS) a.otMin += (net - WORK_HOURS) * 60;
    }
  }

  const result = (workers as any[]).map((w) => {
    const wid = String(w._id);
    const t = tMap[wid] || { completed: 0, inProgress: 0, pending: 0, onTime: 0, ratingSum: 0, ratingCount: 0 };
    const a = aMap[wid] || { dates: new Set<string>(), netHours: 0, otMin: 0 };
    return {
      _id: wid,
      fullName: w.fullName,
      position: w.position || '',
      completed: t.completed,
      inProgress: t.inProgress,
      pending: t.pending,
      onTimeRate: t.completed > 0 ? Math.round((t.onTime / t.completed) * 100) : null,
      avgRating: t.ratingCount > 0 ? +(t.ratingSum / t.ratingCount).toFixed(1) : null,
      workDays: a.dates.size,
      hours: Math.round(a.netHours),
      overtimeHours: +(a.otMin / 60).toFixed(1),
    };
  });

  // Eng samaralidan tartiblash (bajarilgan, keyin o'z vaqtida %)
  result.sort((x, y) => y.completed - x.completed || (y.onTimeRate ?? 0) - (x.onTimeRate ?? 0));

  const totalCompleted = result.reduce((s, w) => s + w.completed, 0);
  const totalHours = result.reduce((s, w) => s + w.hours, 0);
  const rated = result.filter((w) => w.onTimeRate !== null);
  const avgOnTime = rated.length ? Math.round(rated.reduce((s, w) => s + (w.onTimeRate || 0), 0) / rated.length) : null;
  const top = result[0] && result[0].completed > 0 ? result[0].fullName : null;

  return NextResponse.json({
    period,
    workers: result,
    summary: { totalCompleted, totalHours, avgOnTime, top },
  });
}
