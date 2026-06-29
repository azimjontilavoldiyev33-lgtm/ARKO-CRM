import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';

// GET /api/mobile/attendance/report — ishchining O'Z davomati (token bo'yicha)
export async function GET(req: NextRequest) {
  try {
    const workerId = await getWorkerIdFromRequest(req);
    if (!workerId) {
      return NextResponse.json(
        { success: false, message: 'Avtorizatsiya talab qilinadi' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filter: Record<string, unknown> = { worker: workerId };
    if (startDate || endDate) {
      const range: Record<string, Date> = {};
      if (startDate) range.$gte = new Date(startDate);
      if (endDate) range.$lte = new Date(endDate);
      filter.checkIn = range;
    }

    const records = await Attendance.find(filter).sort({ checkIn: -1 });

    // Mobil ilova formatida: har sessiyani kelish/ketish hodisalariga ajratish
    const events = records.flatMap((r) => {
      const out: unknown[] = [];
      if (r.checkIn) {
        out.push({
          _id: r._id + '_in',
          workerId,
          type: 'check-in',
          lat: (r.location as { latitude?: number })?.latitude ?? 0,
          lng: (r.location as { longitude?: number })?.longitude ?? 0,
          timestamp: r.checkIn,
        });
      }
      if (r.checkOut) {
        const co = (r as { checkOutLocation?: { latitude?: number; longitude?: number } })
          .checkOutLocation;
        out.push({
          _id: r._id + '_out',
          workerId,
          type: 'check-out',
          lat: co?.latitude ?? (r.location as { latitude?: number })?.latitude ?? 0,
          lng: co?.longitude ?? (r.location as { longitude?: number })?.longitude ?? 0,
          timestamp: r.checkOut,
        });
      }
      return out;
    });

    return NextResponse.json({ success: true, data: events });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
