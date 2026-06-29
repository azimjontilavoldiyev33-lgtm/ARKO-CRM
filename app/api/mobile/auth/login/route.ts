import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';
import { signWorkerToken } from '@/lib/mobileAuth';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { reportError } from '@/lib/reportError';

// POST /api/mobile/auth/login — ishchi telefon raqami + kirish kodi bilan kiradi
export async function POST(req: NextRequest) {
  try {
    // Brute-force himoyasi: IP bo'yicha 15 daqiqada 10 urinish
    const limit = await rateLimit(`mlogin:${clientIp(req)}`, 10, 15 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: `Juda ko'p urinish. ${limit.retryAfter} soniyadan keyin qayta urinib ko'ring.` },
        { status: 429 }
      );
    }

    await connectDB();
    const { phoneNumber, code, deviceId } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Telefon raqam majburiy' },
        { status: 400 }
      );
    }

    // Kirish kodi — adminda generatsiya qilinadigan 4 xonali maxfiy kod.
    // Telefon raqamini bilgan begona hisobni egallab olmasin (parol o'rnida).
    if (!code || !/^\d{4}$/.test(String(code))) {
      return NextResponse.json(
        { success: false, message: '4 xonali kirish kodini kiriting' },
        { status: 400 }
      );
    }

    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: 'Qurilma aniqlanmadi. Ilovani qayta oching.' },
        { status: 400 }
      );
    }

    // Format farqlarini hisobga olib, oxirgi 9 ta raqam bo'yicha qidiramiz
    // ("+998901234567", "901234567", "90 123 45 67" — hammasi mos keladi)
    const digits = String(phoneNumber).replace(/\D/g, '');
    const last9 = digits.slice(-9);

    const worker = await Worker.findOne({
      phoneNumber: { $regex: last9 + '$' },
      code: String(code),
    });

    // Telefon yoki kod noto'g'ri — qaysi biri xato ekanini OSHKOR qilmaymiz
    // (hisob enumeratsiyasi oldini olish).
    if (!worker) {
      return NextResponse.json(
        { success: false, message: "Telefon raqam yoki kod noto'g'ri" },
        { status: 401 }
      );
    }

    // Qurilma biriktirish:
    //  - Hisob hali hech qaysi qurilmaga bog'lanmagan bo'lsa — shu qurilmaga biriktiramiz.
    //  - Boshqa qurilmaga bog'langan bo'lsa — kirishni bloklaymiz (firibgarlik oldini olish).
    if (!worker.deviceId) {
      worker.deviceId = deviceId;
      worker.deviceBoundAt = new Date();
      await worker.save();
    } else if (worker.deviceId !== deviceId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bu hisob boshqa telefonga biriktirilgan. Yangi telefondan kirish uchun administrator qurilmani uzishi kerak.",
        },
        { status: 403 }
      );
    }

    const token = await signWorkerToken(String(worker._id));

    return NextResponse.json({ success: true, token, worker });
  } catch (err) {
    reportError('POST /api/mobile/auth/login', err);
    return NextResponse.json(
      { success: false, message: 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
