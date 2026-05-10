import { Telegraf } from 'telegraf';
import { connectDB } from './lib/mongodb';
import Worker from './models/Worker';
import Task from './models/Task';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN topilmadi!");

const bot = new Telegraf(token);

// /start bosilganda
bot.start(async (ctx) => {
  await ctx.reply('Assalomu alaykum! Mebel CRM botiga xush kelibsiz.\nIltimos, telefon raqamingizni yuboring:', {
    reply_markup: {
      keyboard: [[{ text: "📲 Kontakni yuborish", request_contact: true }]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
});

// Kontakt yuborilganda
bot.on('contact', async (ctx) => {
  try {
    await connectDB();
    const contact = ctx.message.contact;
    const chatId = ctx.chat.id.toString();
    const phone = contact.phone_number.replace('+', '');
    const worker = await Worker.findOne({ phoneNumber: phone });

    if (worker) {
      worker.telegramChatId = chatId;
      await worker.save();
      await ctx.reply(`Rahmat, ${worker.fullName}! Tizimga ulandingiz. ✅`, {
        reply_markup: { remove_keyboard: true }
      });
    } else {
      await ctx.reply(`Siz bazada yo'qsiz. Admin telefon raqamingizni kiritishi kerak. ❌`);
    }
  } catch (error) {
    console.error('Xatolik:', error);
    await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
  }
});

// Ishni boshlash
bot.action(/^start_(.+)$/, async (ctx) => {
  try {
    await connectDB();
    const taskId = ctx.match[1];
    await Task.findByIdAndUpdate(taskId, {
      status: 'in_progress',
      startedAt: new Date(),
    });
    await ctx.editMessageText('✅ Ish boshlandi! Tugatgach tugmani bosing:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Tugatdim', callback_data: `done_${taskId}` }
        ]]
      }
    });
    await ctx.answerCbQuery('Ish boshlandi!');
  } catch (error) {
    console.error('Start action xatosi:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
});

// Ishni tugatish
bot.action(/^done_(.+)$/, async (ctx) => {
  try {
    await connectDB();
    const taskId = ctx.match[1];
    await Task.findByIdAndUpdate(taskId, {
      status: 'completed',
      completedAt: new Date(),
    });
    await ctx.editMessageText('🎉 Barakalla! Ish muvaffaqiyatli tugallandi.');
    await ctx.answerCbQuery('Barakalla!');
  } catch (error) {
    console.error('Done action xatosi:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
});
// Usta o'z profilini ko'rishi
bot.command('profile', async (ctx) => {
  try {
    await connectDB();
    const chatId = ctx.chat.id.toString();
    const worker = await Worker.findOne({ telegramChatId: chatId });

    if (!worker) {
      await ctx.reply('Siz tizimga ulanmagansiz. /start bosing.');
      return;
    }

    const tasks = await Task.find({ worker: worker._id });
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(t => 
      new Date(t.deadline) < new Date() && t.status !== 'completed'
    ).length;
    const ratedTasks = tasks.filter(t => t.rating);
    const avgRating = ratedTasks.length > 0
      ? (ratedTasks.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTasks.length).toFixed(1)
      : 'Hali baholanmagan';

    await ctx.reply(
      `👷 *${worker.fullName}*\n\n` +
      `📞 Telefon: +${worker.phoneNumber}\n` +
      `💼 Lavozim: ${worker.position || 'Belgilanmagan'}\n\n` +
      `📊 *Statistika:*\n` +
      `✅ Bajarilgan: ${completed} ta\n` +
      `▶️ Jarayonda: ${inProgress} ta\n` +
      `⏳ Kutilmoqda: ${pending} ta\n` +
      `⚠️ Kechikkan: ${overdue} ta\n\n` +
      `⭐ O'rtacha baho: ${avgRating}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Profile xatosi:', error);
    await ctx.reply('Xatolik yuz berdi.');
  }
});

export default bot;