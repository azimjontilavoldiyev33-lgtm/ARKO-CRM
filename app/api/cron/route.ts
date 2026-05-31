import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import { notifyAll } from '@/lib/sse'; // ← to'g'ri

export async function GET() {
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