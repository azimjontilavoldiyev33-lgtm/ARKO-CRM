import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OfficeLocation from '@/models/OfficeLocation';
import { getAuth } from '@/lib/auth';
import { officeLocationSchema, parseBody } from '@/lib/validation';

// GET - ishxona hududi olish (admin o'z korxonasiniki)
export async function GET() {
  try {
    const auth = await getAuth();
    if (!auth?.companyId) return NextResponse.json({ success: false, message: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
    await connectDB();
    const location = await OfficeLocation.findOne({ company: auth.companyId });
    return NextResponse.json({ success: true, data: location });
  } catch {
    return NextResponse.json({ success: false, message: 'Xatolik yuz berdi' }, { status: 500 });
  }
}

// POST - ishxona hududi belgilash/yangilash
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth?.companyId) return NextResponse.json({ success: false, message: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
    await connectDB();
    const parsed = parseBody(officeLocationSchema, await req.json().catch(() => null));
    if (!parsed.ok) return parsed.response;
    const { name, lat, lng, radius } = parsed.data;

    // Korxonaga tegishli ofisni yangilash/yaratish
    const company = auth.companyId;
    const location = await OfficeLocation.findOneAndUpdate(
      { company },
      { name, lat, lng, radius: radius || 100, company },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: location });
  } catch {
    return NextResponse.json({ success: false, message: 'Xatolik yuz berdi' }, { status: 500 });
  }
}