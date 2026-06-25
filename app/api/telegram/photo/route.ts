import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

// GET /api/telegram/photo?file=<telegram_file_path>
// Telegram fayl rasmini server orqali yetkazadi — bot token HECH QACHON client'ga
// chiqmaydi. Faqat avtorizatsiyalangan admin ko'ra oladi.
export async function GET(req: Request) {
  const auth = await getAuth();
  if (!auth?.adminId) {
    return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }

  const file = new URL(req.url).searchParams.get('file');
  if (!file) {
    return NextResponse.json({ error: 'file talab qilinadi' }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Bot token sozlanmagan' }, { status: 500 });
  }

  // Path traversal va tashqi URL'larga so'rovning oldini olish.
  if (file.includes('..') || file.startsWith('/') || /^https?:/i.test(file)) {
    return NextResponse.json({ error: "Noto'g'ri fayl yo'li" }, { status: 400 });
  }

  const tgUrl = `https://api.telegram.org/file/bot${token}/${file}`;
  const tgRes = await fetch(tgUrl);
  if (!tgRes.ok || !tgRes.body) {
    return NextResponse.json({ error: 'Rasm topilmadi' }, { status: 404 });
  }

  return new NextResponse(tgRes.body, {
    status: 200,
    headers: {
      'Content-Type': tgRes.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
