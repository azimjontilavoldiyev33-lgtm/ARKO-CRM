import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';
import { signWorkerToken } from '@/lib/mobileAuth';

// POST /api/mobile/auth/login — ishchi telefon raqami bilan kiradi
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Telefon raqam majburiy' },
        { status: 400 }
      );
    }

    // Format farqlarini hisobga olib, oxirgi 9 ta raqam bo'yicha qidiramiz
    // ("+998901234567", "901234567", "90 123 45 67" — hammasi mos keladi)
    const digits = String(phoneNumber).replace(/\D/g, '');
    const last9 = digits.slice(-9);

    const worker = await Worker.findOne({
      phoneNumber: { $regex: last9 + '$' },
    });

    if (!worker) {
      return NextResponse.json(
        { success: false, message: 'Ishchi topilmadi' },
        { status: 404 }
      );
    }

    const token = await signWorkerToken(String(worker._id));

    return NextResponse.json({ success: true, token, worker });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
