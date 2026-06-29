import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Company from '@/models/Company';
import { getAuth } from '@/lib/auth';

// PATCH /api/superadmin/companies/[id] — tarif yoki faollikni o'zgartirish.
// To'lamagan mijozni vaqtincha to'xtatish (isActive: false) uchun ham. Faqat superadmin.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (auth?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Faqat superadmin' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const update: Record<string, unknown> = {};
  if (body?.plan === 'basic' || body?.plan === 'pro') update.plan = body.plan;
  if (typeof body?.isActive === 'boolean') update.isActive = body.isActive;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "O'zgartirish uchun maydon yo'q" }, { status: 400 });
  }

  await connectDB();
  const company = await Company.findByIdAndUpdate(id, update, { new: true }).select('name plan isActive');
  if (!company) return NextResponse.json({ error: 'Korxona topilmadi' }, { status: 404 });
  return NextResponse.json({ ok: true, company });
}
