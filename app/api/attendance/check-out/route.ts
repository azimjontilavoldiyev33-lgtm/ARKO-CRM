import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import OfficeLocation from '@/models/OfficeLocation';

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { workerId, lat, lng, faceVerified } = await req.json();

    if (!workerId || !lat || !lng) {
      return NextResponse.json({ success: false, message: "workerId, lat, lng majburiy" }, { status: 400 });
    }

    if (!faceVerified) {
      return NextResponse.json({ success: false, message: "Face ID tasdiqlanmadi" }, { status: 403 });
    }

    const office = await OfficeLocation.findOne();
    if (!office) {
      return NextResponse.json({ success: false, message: "Ishxona hududi belgilanmagan" }, { status: 400 });
    }

    const distance = getDistance(lat, lng, office.lat, office.lng);
    if (distance > office.radius) {
      return NextResponse.json({
        success: false,
        message: `Siz ishxona hududidan tashqaridasiz (${Math.round(distance)}m)`,
      }, { status: 403 });
    }

    // Bugun check-in qilganmi?
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = await Attendance.findOne({
      workerId,
      type: 'check-in',
      timestamp: { $gte: today },
    });

    if (!checkIn) {
      return NextResponse.json({ success: false, message: "Avval kirishni tasdiqlang" }, { status: 400 });
    }

    // Bugun allaqachon check-out qilganmi?
    const existingOut = await Attendance.findOne({
      workerId,
      type: 'check-out',
      timestamp: { $gte: today },
    });

    if (existingOut) {
      return NextResponse.json({ success: false, message: "Bugun allaqachon chiqishni tasdiqlagan" }, { status: 400 });
    }

    const attendance = await Attendance.create({
      workerId,
      type: 'check-out',
      lat,
      lng,
      faceVerified: true,
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Xatolik yuz berdi' }, { status: 500 });
  }
}