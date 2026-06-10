import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';
import Attendance from '@/models/Attendance';
import Task from '@/models/Task';
import Company from '@/models/Company';
import { getAuth } from '@/lib/auth';

const WORK_HOURS = 8;   // standart ish kuni
const LUNCH = 1;        // obed (soat)
const TASH = 5 * 60 * 60 * 1000; // UTC+5 (Toshkent)

// Toshkent vaqti bo'yicha kun raqami (Vercel UTC bo'lgani uchun ofset qo'shamiz)
function tashDay(d: Date): number {
  return new Date(d.getTime() + TASH).getUTCDate();
}

function workDaysInMonth(year: number, month: number): number {
  const days = new Date(year, month, 0).getDate();
  let c = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() !== 0) c++; // yakshanbasiz
  }
  return c;
}

interface DayCell {
  in: string;
  out: string | null;
  otMin: number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') || '');
  const year = parseInt(searchParams.get('year') || '');

  if (!month || !year) {
    return NextResponse.json({ error: 'month va year majburiy' }, { status: 400 });
  }

  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  await connectDB();

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalWorkDays = workDaysInMonth(year, month);

  const workers = await Worker.find({ company: auth.companyId }).sort({ fullName: 1 });
  const records = await Attendance.find({ company: auth.companyId, checkIn: { $gte: from, $lt: to } });

  // Ball: shu oyda BAJARILGAN vazifalar — o'z vaqtida +1, kechikkan −1. Oylikka ball×qiymat qo'shiladi/ushlanadi.
  const tasks = await Task.find({ company: auth.companyId, status: 'completed', completedAt: { $gte: from, $lt: to } }).select('worker deadline completedAt');
  const company = await Company.findById(auth.companyId).select('pointValue');
  const pointValue = company?.pointValue || 0;
  const pMap: Record<string, { onTime: number; late: number }> = {};
  for (const t of tasks) {
    const wid = String(t.worker);
    const p = (pMap[wid] ??= { onTime: 0, late: 0 });
    if (t.completedAt && t.deadline) {
      if (new Date(t.completedAt) <= new Date(t.deadline)) p.onTime++; else p.late++;
    }
  }

  // workerId -> { kun: {in, out, otMin} }
  const map: Record<string, Record<number, DayCell>> = {};

  for (const r of records) {
    const wid = String(r.worker);
    const inDate = new Date(r.checkIn);
    const day = tashDay(inDate);
    const inISO = inDate.toISOString();
    const outISO = r.checkOut ? new Date(r.checkOut).toISOString() : null;

    let otMin = 0;
    if (r.checkOut) {
      const gross = (new Date(r.checkOut).getTime() - inDate.getTime()) / 3600000;
      const net = gross - LUNCH;
      if (net > WORK_HOURS) otMin = (net - WORK_HOURS) * 60;
    }

    if (!map[wid]) map[wid] = {};
    const cell = map[wid][day];
    if (!cell) {
      map[wid][day] = { in: inISO, out: outISO, otMin };
    } else {
      // Bir kunda bir nechta sessiya — eng erta kelish, eng kech ketish, OT yig'iladi
      if (inISO < cell.in) cell.in = inISO;
      if (outISO && (!cell.out || outISO > cell.out)) cell.out = outISO;
      cell.otMin += otMin;
    }
  }

  const result = workers.map((w) => {
    const wid = String(w._id);
    const days = map[wid] || {};
    const workDays = Object.keys(days).length;

    let otMin = 0;
    for (const k in days) otMin += days[k].otMin;

    const base = w.salary || 0;
    const hourlyRate = totalWorkDays > 0 ? base / (totalWorkDays * WORK_HOURS) : 0;
    const dailyRate = hourlyRate * WORK_HOURS;
    const overtimePay = (otMin / 60) * hourlyRate;
    const baseEarned = dailyRate * workDays;
    const pts = pMap[wid] || { onTime: 0, late: 0 };
    const points = pts.onTime - pts.late;
    const pointBonus = Math.round(points * pointValue);
    const totalSalary = baseEarned + overtimePay + pointBonus;

    return {
      _id: wid,
      fullName: w.fullName,
      position: w.position || '',
      salary: base,
      days, // { '1': {in,out,otMin}, '2': {...} }
      workDays,
      overtimeHours: +(otMin / 60).toFixed(1),
      overtimePay: Math.round(overtimePay),
      baseEarned: Math.round(baseEarned),
      points,
      pointBonus,
      totalSalary: Math.round(totalSalary),
    };
  });

  return NextResponse.json({ month, year, daysInMonth, totalWorkDays, pointValue, workers: result });
}
