import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import OfficeLocation from '@/models/OfficeLocation';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';
import { distanceInMeters } from '@/lib/distance';
import { notifyAll } from '@/lib/sse';

// POST /api/mobile/attendance/check-in — KELDI
export async function POST(req: NextRequest) {
  try {
    const workerId = await getWorkerIdFromRequest(req);
    if (!workerId) {
      return NextResponse.json(
        { success: false, message: 'Avtorizatsiya talab qilinadi' },
        { status: 401 }
      );
    }

    await connectDB();
    const { lat, lng } = await req.json();

    if (lat == null || lng == null) {
      return NextResponse.json(
        { success: false, message: 'GPS koordinatasi yuborilmadi' },
        { status: 400 }
      );
    }

    // 1) Geofence — masofa SERVERda hisoblanadi
    const office = await OfficeLocation.findOne();
    if (!office) {
      return NextResponse.json(
        { success: false, message: "Ishxona hududi hali sozlanmagan. Administrator bilan bog'laning." },
        { status: 503 }
      );
    }

    const distance = Math.round(distanceInMeters(lat, lng, office.lat, office.lng));
    if (distance > office.radius) {
      return NextResponse.json(
        {
          success: false,
          message: `Siz ish joyidan ${distance} m uzoqdasiz (ruxsat: ${office.radius} m). Yaqinroq keling.`,
          distance,
        },
        { status: 403 }
      );
    }

    // 2) Ikki marta "keldi"dan himoya — ochiq sessiya bo'lmasligi kerak
    const open = await Attendance.findOne({
      worker: workerId,
      checkOut: null,
    }).sort({ checkIn: -1 });

    if (open) {
      return NextResponse.json(
        { success: false, message: 'Sizda ochiq sessiya bor. Avval "Ketdi" bosing.' },
        { status: 409 }
      );
    }

    const attendance = await Attendance.create({
      worker: workerId,
      checkIn: new Date(),
      location: { latitude: lat, longitude: lng },
    });

    // Real-time: admin panelni yangilash
    notifyAll();

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: attendance._id,
          workerId,
          type: 'check-in',
          lat,
          lng,
          distance,
          faceVerified: true,
          timestamp: attendance.checkIn,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
