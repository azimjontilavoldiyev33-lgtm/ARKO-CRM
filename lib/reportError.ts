// Markazlashgan server-side xato hisoboti (production monitoring).
//
// 1) Har doim — structured JSON log (Vercel/hosting log agregatori ushlaydi).
// 2) ADMIN_TELEGRAM_CHAT_ID sozlangan bo'lsa — admin'ga Telegram ogohlantirishi
//    (spam bo'lmasligi uchun bir xil xato 5 daqiqada bir marta yuboriladi).
// 3) Kelajakda: SENTRY_DSN qo'shilsa shu yerga Sentry ulash mumkin (bitta joy).

const lastSent = new Map<string, number>();
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

function shouldAlert(key: string): boolean {
  const now = Date.now();
  const prev = lastSent.get(key) ?? 0;
  if (now - prev < ALERT_COOLDOWN_MS) return false;
  lastSent.set(key, now);
  if (lastSent.size > 1000) lastSent.clear(); // xotira o'smasin
  return true;
}

async function alertTelegram(context: string, message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  if (!shouldAlert(context)) return;
  try {
    const text = `🚨 <b>Xatolik</b>\n<code>${context}</code>\n${message.slice(0, 500)}`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch {
    /* ogohlantirish yuborilmasa ham asosiy oqim buzilmasin */
  }
}

/**
 * API route'larining catch bloklarida chaqiriladi.
 * @param context Qisqa joy nomi, masalan "POST /api/orders"
 * @param err     Ushlangan xato
 */
export function reportError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  // 1) Structured log — hosting log agregatori uchun
  console.error(JSON.stringify({
    level: 'error',
    context,
    message,
    stack,
    time: new Date().toISOString(),
  }));

  // 2) Telegram ogohlantirishi (cooldown bilan)
  void alertTelegram(context, message);
}
