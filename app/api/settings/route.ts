import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Company from '@/models/Company';
import { getAuth } from '@/lib/auth';

// GET /api/settings — korxona sozlamalari (hozircha ball qiymati). Pro-only.
export async function GET() {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();
  const company = await Company.findById(auth.companyId).select('pointValue');
  return NextResponse.json({ pointValue: company?.pointValue || 0 });
}

// PATCH /api/settings — ball qiymatini (1 ball = ? so'm) yangilash. Pro-only.
export async function PATCH(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.pointValue !== undefined) {
    const n = Math.round(Number(body.pointValue));
    update.pointValue = Number.isFinite(n) && n > 0 ? n : 0;
  }
  const company = await Company.findByIdAndUpdate(auth.companyId, update, { new: true }).select('pointValue');
  return NextResponse.json({ pointValue: company?.pointValue || 0 });
}
