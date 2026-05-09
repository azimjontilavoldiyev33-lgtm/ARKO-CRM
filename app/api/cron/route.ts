import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import bot from '@/bot';

export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    // Muddati o'tgan va tugallanmagan vazifalarni topish
    const overdueTasks = await Task.find({
      deadline: { $lt: now },
      status: { $in: ['pending', 'in_progress'] },
    })
      .populate('worker', 'fullName telegramChatId')
      .populate('order', 'title');

    if (overdueTasks.length === 0) {
      return NextResponse.json({ ok: true, message: 'Kechikgan vazifa yo\'q' });
    }

    let notified = 0;

    for (const task of overdueTasks) {
      const worker = task.worker as any;
      const order = task.order as any;

      // Ustaga xabar
      if (worker?.telegramChatId) {
        try {
          await bot.telegram.sendMessage(
            worker.telegramChatId,
            `⚠️ *Diqqat! Vazifa muddati o'tdi!*\n\n` +
            `📋 Vazifa: ${task.title}\n` +
            `📦 Buyurtma: ${order?.title}\n` +
            `⏰ Muddat: ${new Date(task.deadline).toLocaleDateString('uz-UZ')}\n\n` +
            `Iltimos, tezroq bajaring!`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [[
                  task.status === 'pending'
                    ? { text: '▶️ Ishni boshlash', callback_data: `start_${task._id}` }
                    : { text: '✅ Tugatdim', callback_data: `done_${task._id}` }
                ]]
              }
            }
          );
          notified++;
        } catch (err) {
          console.error(`Xabar yuborishda xato (${worker.fullName}):`, err);
        }
      }

      // Adminga xabar
      if (process.env.ADMIN_TELEGRAM_CHAT_ID) {
        try {
          await bot.telegram.sendMessage(
            process.env.ADMIN_TELEGRAM_CHAT_ID,
            `🚨 *Kechikkan vazifa!*\n\n` +
            `📋 Vazifa: ${task.title}\n` +
            `👷 Usta: ${worker?.fullName}\n` +
            `📦 Buyurtma: ${order?.title}\n` +
            `⏰ Muddat: ${new Date(task.deadline).toLocaleDateString('uz-UZ')}`,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          console.error('Adminga xabar yuborishda xato:', err);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      overdue: overdueTasks.length,
      notified,
    });

  } catch (err) {
    console.error('Cron xatosi:', err);
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}