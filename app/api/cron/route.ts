import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import Worker from '@/models/Worker';
import Order from '@/models/Order';
import { notifyAll } from '@/lib/sse';

// populate('worker'|'order') uchun modellar ro'yxatdan o'tishi shart
void [Worker, Order];

export async function GET(req: Request) {
  // CRON_SECRET o'rnatilgan bo'lsa — faqat to'g'ri Bearer token bilan ishlaydi
  // (Vercel Cron `Authorization: Bearer <CRON_SECRET>` yuboradi).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const now = new Date();

    const overdueTasks = await Task.find({
      deadline: { $lt: now },
      status: { $in: ['pending', 'in_progress'] },
    })
      .populate('worker', 'fullName')
      .populate('order', 'title');

    if (overdueTasks.length === 0) {
      return NextResponse.json({ ok: true, message: "Kechikgan vazifa yo'q" });
    }

    // Barcha monitorlarga signal — overdue banner yangilansin
    notifyAll();

    return NextResponse.json({
      ok: true,
      overdue: overdueTasks.length,
    });

  } catch (err) {
    console.error('Cron xatosi:', err);
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}