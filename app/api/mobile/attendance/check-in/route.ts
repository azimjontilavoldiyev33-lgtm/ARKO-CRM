import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import OfficeLocation from '@/models/OfficeLocation';
import Worker from '@/models/Worker';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';
import { sendCompanyTelegram, escapeHtml } from '@/lib/telegram';
import { distanceInMeters } from '@/lib/distance';
import { notifyAll } from '@/lib/sse';
import { getDefaultCompanyId } from '@/lib/company';
import { reportError } from '@/lib/reportError';

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

    // Qurilma tekshiruvi — token nusxalanib boshqa telefonda ishlatilishining oldini oladi
    const reqDeviceId = req.headers.get('x-device-id') || '';
    const worker = await Worker.findById(workerId).select('deviceId company fullName');
    if (worker?.deviceId && worker.deviceId !== reqDeviceId) {
      return NextResponse.json(
        { success: false, message: 'Bu qurilma hisobingizga biriktirilmagan. Administrator bilan bog\'laning.' },
        { status: 403 }
      );
    }

    // Davomat ishchining O'Z korxonasi bilan saqlanadi (admin shu bo'yicha ko'radi).
    const companyId = worker?.company ? String(worker.company) : await getDefaultCompanyId();

    const { lat, lng } = await req.json();

    if (lat == null || lng == null) {
      return NextResponse.json(
        { success: false, message: 'GPS koordinatasi yuborilmadi' },
        { status: 400 }
      );
    }

    // 1) Geofence — masofa SERVERda hisoblanadi (faqat ishchining O'Z korxonasi ofisi;
    //    boshqa korxona ofisiga fallback YO'Q — ko'p-ijara aralashmasligi uchun)
    const office = await OfficeLocation.findOne({ company: companyId });
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
      company: companyId,
    });

    // Real-time: admin panelni yangilash
    notifyAll();

    // Telegram ogohlantirish — ishchi keldi
    const t = new Date(attendance.checkIn).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
    void sendCompanyTelegram(companyId, `👷 <b>${escapeHtml(worker?.fullName || 'Ishchi')}</b> ish joyiga keldi\n🕐 ${t} · 📍 ${distance} m`);

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
          timestamp: attendance.checkIn,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    reportError('POST /api/mobile/attendance/check-in', err);
    return NextResponse.json(
      { success: false, message: 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
