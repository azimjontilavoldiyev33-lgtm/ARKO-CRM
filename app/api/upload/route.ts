import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuth } from '@/lib/auth';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';
import { reportError } from '@/lib/reportError';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: Request) {
  try {
    // Faqat avtorizatsiyalangan admin (cookie) yoki ishchi (Bearer token) yuklay oladi —
    // ochiq yuklash Cloudinary'ni suiiste'mol qilishdan himoyalaydi.
    const auth = await getAuth();
    const workerId = auth ? null : await getWorkerIdFromRequest(req);
    if (!auth && !workerId) {
      return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 });
    }

    // Faqat rasm va hajm cheklovi — abuse va xotira sarfining oldini oladi.
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Faqat rasm (jpg, png, webp, gif) ruxsat etiladi' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Fayl hajmi 8 MB dan oshmasligi kerak' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'mebel-crm',
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    reportError('POST /api/upload', err);
    return NextResponse.json({ error: 'Yuklashda xato' }, { status: 500 });
  }
}