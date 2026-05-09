import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import Worker from '@/models/Worker';
import Order from '@/models/Order';
import bot from '@/bot';

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const workerId = searchParams.get('worker');

  const query = workerId ? { worker: workerId } : {};

  const tasks = await Task.find(query)
    .populate('order', 'title')
    .populate('worker', 'fullName')
    .sort({ createdAt: -1 });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  try {
    const task = await Task.create(body);
    const worker = await Worker.findById(body.worker);
    const order = await Order.findById(body.order);

    if (worker?.telegramChatId) {
      const deadline = new Date(body.deadline).toLocaleDateString('uz-UZ');

      if (order?.images && order.images.length > 0) {
        await bot.telegram.sendPhoto(
          worker.telegramChatId,
          order.images[0],
          {
            caption:
              `📋 *Yangi vazifa!*\n\n` +
              `📌 Vazifa: ${body.title}\n` +
              `📦 Buyurtma: ${order.title}\n` +
              `⏰ Muddat: ${deadline}\n\n` +
              `Boshlashga tayor bo'lsangiz tugmani bosing:`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '▶️ Ishni boshlash', callback_data: `start_${task._id}` }
              ]]
            }
          }
        );

        if (order.images.length > 1) {
          const mediaGroup = order.images.slice(1).map((url: string) => ({
            type: 'photo' as const,
            media: url,
          }));
          await bot.telegram.sendMediaGroup(worker.telegramChatId, mediaGroup);
        }
      } else {
        await bot.telegram.sendMessage(
          worker.telegramChatId,
          `📋 *Yangi vazifa!*\n\n` +
          `📌 Vazifa: ${body.title}\n` +
          `📦 Buyurtma: ${order?.title}\n` +
          `⏰ Muddat: ${deadline}\n\n` +
          `Boshlashga tayor bo'lsangiz tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '▶️ Ishni boshlash', callback_data: `start_${task._id}` }
              ]]
            }
          }
        );
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('Task yaratishda xato:', err);
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}