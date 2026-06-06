import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Worker from '@/models/Worker';
import { getAuth } from '@/lib/auth';

// populate('worker') uchun Worker modeli ro'yxatdan o'tishi shart
void Worker;

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth?.companyId) return NextResponse.json({ success: false, message: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filter: Record<string, unknown> = { company: auth.companyId };

    if (workerId) {
      filter.worker = workerId;
    }

    if (startDate || endDate) {
      filter.checkIn = {};
      if (startDate) {
        (filter.checkIn as Record<string, unknown>).$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (filter.checkIn as Record<string, unknown>).$lte = end;
      }
    }

    const records = await Attendance.find(filter)
      .populate('worker', 'fullName phoneNumber position')
      .sort({ checkIn: -1 });

    // Kunlik hisobot
    const grouped: Record<string, {
      worker: unknown;
      date: string;
      checkIn: Date | null;
      checkOut: Date | null;
      duration: string | null;
    }> = {};

    for (const record of records) {
      const date = new Date(record.checkIn).toISOString().split('T')[0];
      const key = `${record.worker._id}_${date}`;

      if (!grouped[key]) {
        grouped[key] = {
          worker: record.worker,
          date,
          checkIn: record.checkIn ?? null,
          checkOut: record.checkOut ?? null,
          duration: null,
        };
      }
    }

    // Ish vaqtini hisoblash
    for (const key in grouped) {
      const { checkIn, checkOut } = grouped[key];
      if (checkIn && checkOut) {
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        grouped[key].duration = `${hours}s ${minutes}d`;
      }
    }

    return NextResponse.json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}