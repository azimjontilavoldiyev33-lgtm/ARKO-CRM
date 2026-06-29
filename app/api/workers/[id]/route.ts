import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';
import { getAuth } from '@/lib/auth';
import { workerUpdateSchema, parseBody } from '@/lib/validation';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  // 4 xonali kod orqali qidirish — bu yo'l PUBLIK monitor kioski uchun.
  // Maxfiy maydonlar (oylik, telefon, deviceId, telegram) QAYTARILMAYDI;
  // kioskka faqat ism/lavozim/kod kerak. Shu bilan kod brute-force qilinsa ham
  // maosh/telefon sizib chiqmaydi.
  if (/^\d{4}$/.test(id)) {
    const worker = await Worker.findOne({ code: id }).select('fullName position code company');
    if (!worker) return NextResponse.json({ error: 'Ishchi topilmadi' }, { status: 404 });
    return NextResponse.json(worker);
  }

  // ObjectId orqali to'liq ma'lumot — faqat avtorizatsiyalangan admin, o'z korxonasi.
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  const worker = await Worker.findOne({ _id: id, company: auth.companyId });
  if (!worker) return NextResponse.json({ error: 'Ishchi topilmadi' }, { status: 404 });
  return NextResponse.json(worker);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  await Worker.findOneAndDelete({ _id: id, company: auth.companyId });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const parsed = parseBody(workerUpdateSchema, await req.json().catch(() => null));
  if (!parsed.ok) return parsed.response;
  const { resetDevice, ...fields } = parsed.data;

  // Schema faqat ruxsat etilgan maydonlarni o'tkazadi (body.company/code/deviceId qabul qilinmaydi)
  const update: Record<string, unknown> = { ...fields };

  // Qurilma biriktirishni faqat UZISH mumkin — { resetDevice: true } yuborilsa
  // biriktirish bekor qilinadi, ishchi yangi telefondan kira oladi.
  if (resetDevice === true) {
    update.deviceId = null;
    update.deviceBoundAt = null;
  }

  try {
    const worker = await Worker.findOneAndUpdate({ _id: id, company: auth.companyId }, update, { new: true });
    return NextResponse.json(worker);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      return NextResponse.json({ error: 'Telefon raqam band' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}