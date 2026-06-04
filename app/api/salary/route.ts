import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Attendance from '@/models/Attendance';

const WORK_START = 9;  // 09:00
const WORK_END   = 18; // 18:00
const LUNCH      = 1;  // 1 soat obед
const WORK_HOURS = WORK_END - WORK_START - LUNCH; // 8 soat

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workerId = searchParams.get('workerId');
  const month    = parseInt(searchParams.get('month') || '');
  const year     = parseInt(searchParams.get('year')  || '');
  const salary   = parseFloat(searchParams.get('salary') || '0');

  if (!workerId || !month || !year || !salary) {
    return NextResponse.json({ error: 'Parametrlar yetishmayapti' }, { status: 400 });
  }

  await connectDB();

  // Oy boshи va oxiri
  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 1);

  const records = await Attendance.find({
    worker:  new mongoose.Types.ObjectId(workerId),
    checkIn: { $gte: from, $lt: to },
  });

  // Ish kunlarini hisoblash (yakshanba = 0 hisoblanmaydi)
  let workDays    = 0;
  let overtimeMin = 0;

  for (const rec of records) {
    const day = new Date(rec.checkIn).getDay();
    if (day === 0) continue; // yakshanba — dam olish

    workDays++;

    // Overtime — ish DAVOMIYLIGI bo'yicha (vaqt zonasidan mustaqil).
    // (checkOut - checkIn) - obed > 8 soat bo'lsa, ortig'i overtime.
    // (Oldin chiqish soati 18:00 dan oshsa deb hisoblardi — Vercel UTC bo'lgani
    //  uchun noto'g'ri ishlardi.)
    if (rec.checkOut) {
      const grossHours =
        (new Date(rec.checkOut).getTime() - new Date(rec.checkIn).getTime()) / (1000 * 60 * 60);
      const netHours = grossHours - LUNCH; // obed ayirildi
      if (netHours > WORK_HOURS) {
        overtimeMin += (netHours - WORK_HOURS) * 60;
      }
    }
  }

  // Oylik hisob
  // Oy ichidagi ish kunlari (yakshanbасиз)
  const totalWorkDays = getWorkDaysInMonth(year, month);
  const hourlyRate    = salary / (totalWorkDays * WORK_HOURS);
  const dailyRate     = hourlyRate * WORK_HOURS;
  const overtimePay   = (overtimeMin / 60) * hourlyRate;
  const totalSalary   = dailyRate * workDays + overtimePay;

  return NextResponse.json({
    workerId,
    month, year,
    workDays,
    totalWorkDays,
    overtimeHours: +(overtimeMin / 60).toFixed(2),
    hourlyRate:    +hourlyRate.toFixed(0),
    dailyRate:     +dailyRate.toFixed(0),
    overtimePay:   +overtimePay.toFixed(0),
    baseSalary:    +( dailyRate * workDays).toFixed(0),
    totalSalary:   +totalSalary.toFixed(0),
  });
}

// Oy ichidagi ish kunlari (yakshanbасиз)
function getWorkDaysInMonth(year: number, month: number) {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() !== 0) count++;
  }
  return count;
}