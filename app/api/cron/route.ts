import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import Worker from '@/models/Worker';
import Order from '@/models/Order';
import { notifyAll } from '@/lib/sse';
import { reportError } from '@/lib/reportError';

// populate('worker'|'order') uchun modellar ro'yxatdan o'tishi shart
void [Worker, Order];

export async function GET(req: Request) {
  // Faqat sozlangan cron chaqiruvchisi kira oladi.
  // Vercel Cron "Authorization: Bearer <CRON_SECRET>" header yuboradi.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET sozlanmagan' }, { status: 500 });
  }
  const provided = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (provided !== secret) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 });
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
    reportError('GET /api/cron', err);
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}