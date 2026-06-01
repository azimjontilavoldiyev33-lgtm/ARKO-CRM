import { NextResponse } from 'next/server';
import { connectAttendanceDB } from '@/lib/attendanceDb';
import mongoose from 'mongoose';
import AttendanceSchema from '@/models/AttendanceRecord';

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

  const conn = await connectAttendanceDB();
  const Attendance = conn.models.Attendance || conn.model('Attendance', AttendanceSchema);

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

    // Overtime hisoblash
    if (rec.checkOut) {
      const checkOutHour = rec.checkOut.getHours() + rec.checkOut.getMinutes() / 60;
      if (checkOutHour > WORK_END) {
        overtimeMin += (checkOutHour - WORK_END) * 60;
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