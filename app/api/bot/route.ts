import { NextRequest, NextResponse } from 'next/server';
import bot from '@/bot';

// Webhookni bir marta o'rnatish
export async function GET() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`;
  
  await bot.telegram.setWebhook(webhookUrl);
  return NextResponse.json({ status: "Webhook o'rnatildi ✅", url: webhookUrl });
}

// Telegramdan kelgan so'rovlarni qabul qilish
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook xatosi:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}