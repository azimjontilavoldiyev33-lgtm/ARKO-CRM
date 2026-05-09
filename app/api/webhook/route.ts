import { NextResponse } from 'next/server';
import bot from '@/bot';

export async function GET() {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`;
    await bot.telegram.setWebhook(webhookUrl);
    return NextResponse.json({ ok: true, url: webhookUrl });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhookda xato:', err);
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}