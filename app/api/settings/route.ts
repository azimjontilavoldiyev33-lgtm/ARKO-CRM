import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Company from '@/models/Company';
import { getAuth } from '@/lib/auth';
import { settingsSchema, parseBody } from '@/lib/validation';

// GET /api/settings — korxona sozlamalari (hozircha ball qiymati). Pro-only.
export async function GET() {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();
  const company = await Company.findById(auth.companyId).select('pointValue telegramChatId');
  return NextResponse.json({
    pointValue: company?.pointValue || 0,
    telegramChatId: company?.telegramChatId || '',
  });
}

// PATCH /api/settings — ball qiymatini (1 ball = ? so'm) yangilash. Pro-only.
export async function PATCH(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();
  const parsed = parseBody(settingsSchema, await req.json().catch(() => null));
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const update: Record<string, unknown> = {};
  if (body.pointValue !== undefined) {
    const n = Math.round(Number(body.pointValue));
    update.pointValue = Number.isFinite(n) && n > 0 ? n : 0;
  }
  if (body.telegramChatId !== undefined) {
    update.telegramChatId = (body.telegramChatId ?? '').trim() || null;
  }
  const company = await Company.findByIdAndUpdate(auth.companyId, update, { new: true }).select('pointValue telegramChatId');
  return NextResponse.json({
    pointValue: company?.pointValue || 0,
    telegramChatId: company?.telegramChatId || '',
  });
}
