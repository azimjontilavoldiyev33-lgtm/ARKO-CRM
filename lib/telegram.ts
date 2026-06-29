import Company from '@/models/Company';

// Telegram HTML parse_mode uchun maxsus belgilarni xavfsizlantirish.
// Ishchi ismi kabi foydalanuvchi kiritgan matn formatni buzmasligi/inject qilmasligi uchun.
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Korxona Telegram chatiga ogohlantirish yuboradi.
// Chat ID korxona sozlamasidan olinadi; bo'lmasa ADMIN_TELEGRAM_CHAT_ID (env) ga.
// Xato bo'lsa ham asosiy oqim buzilmaydi (jim).
export async function sendCompanyTelegram(companyId: string | null | undefined, text: string): Promise<void> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;

    let chatId: string | null | undefined = null;
    if (companyId) {
      const company = await Company.findById(companyId).select('telegramChatId');
      chatId = company?.telegramChatId;
    }
    if (!chatId) chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (!chatId) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch {
    /* telegram xatosi asosiy oqimni buzmasin */
  }
}
