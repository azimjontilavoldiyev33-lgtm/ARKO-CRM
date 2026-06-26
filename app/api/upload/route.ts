import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuth } from '@/lib/auth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    // Faqat tizimga kirgan admin yuklay oladi (ochiq upload — abuse vektori edi).
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Faqat rasm yuklash mumkin' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Rasm hajmi 5 MB dan oshmasligi kerak' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'mebel-crm',
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload xatosi:', err);
    return NextResponse.json({ error: 'Yuklashda xato' }, { status: 500 });
  }
}