import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getAuth } from '@/lib/auth';

// DELETE /api/finance/[id] — yozuvni o'chirish (Pro-only, korxona bo'yicha)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  const { id } = await params;
  await connectDB();
  await Transaction.findOneAndDelete({ _id: id, company: auth.companyId });
  return NextResponse.json({ ok: true });
}
