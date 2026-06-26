import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import { notifyAll } from '@/lib/sse';
import { advancePipelineOnComplete } from '@/lib/taskFlow';
import { getAuth } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // O'chirish faqat admin paneldan — to'liq auth + korxona scoping (IDOR oldini olish).
  const auth = await getAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }

  await connectDB();
  const deleted = await Task.findOneAndDelete({ _id: id, company: auth.companyId });
  if (!deleted) {
    return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
  }
  notifyAll();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const body = await req.json();

  // `company` va `_id` ni hech qachon body orqali o'zgartirishga yo'l qo'ymaymiz
  // (boshqa korxonaga ko'chirish / id buzish oldini olish).
  const { company: _company, _id: _ignoredId, ...updates } = body;
  void [_company, _ignoredId];

  // Admin sessiyasi bo'lsa — yangilanish o'z korxonasi bilan cheklanadi.
  // Monitor ekranlari sessiyasiz (kiosk) — status/worker'ni yangilashda davom etadi.
  const auth = await getAuth();
  const filter = auth?.companyId ? { _id: id, company: auth.companyId } : { _id: id };

  const task = await Task.findOneAndUpdate(filter, updates, { new: true });
  if (!task) {
    return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
  }
  notifyAll();

  // Pipeline logikasi — status completed bo'lganda keyingi bosqichga o'tkazadi
  if (updates.status === 'completed') {
    await advancePipelineOnComplete(task);
  }

  return NextResponse.json(task);
}
