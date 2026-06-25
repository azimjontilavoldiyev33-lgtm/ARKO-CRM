import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Worker from '@/models/Worker';
import { getAuth } from '@/lib/auth';

// 4 xonali unique kod generatsiya
async function generateCode(): Promise<string> {
  while (true) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const exists = await Worker.findOne({ code });
    if (!exists) return code;
  }
}

export async function GET() {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  await connectDB();
  const workers = await Worker.find({ company: auth.companyId }).sort({ createdAt: -1 });

  // Kodsiz eski ishchilarga avtomatik kod berish (bir martalik backfill)
  for (const w of workers) {
    if (!w.code) {
      w.code = await generateCode();
      await w.save();
    }
  }

  return NextResponse.json(workers);
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  try {
    // Kirish kodi HAR DOIM avtomatik (random + unikal). body.code bo'lsa ham e'tiborsiz.
    const code = await generateCode();
    const worker = await Worker.create({ ...body, code, company: auth.companyId });
    return NextResponse.json(worker, { status: 201 });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      return NextResponse.json({ error: 'Bu telefon raqam allaqachon mavjud' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}