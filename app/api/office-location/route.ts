import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OfficeLocation from '@/models/OfficeLocation';
import { getDefaultCompanyId } from '@/lib/company';

// GET - ishxona hududi olish
export async function GET() {
  try {
    await connectDB();
    const location = await OfficeLocation.findOne();
    return NextResponse.json({ success: true, data: location });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Xatolik yuz berdi' }, { status: 500 });
  }
}

// POST - ishxona hududi belgilash/yangilash
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, lat, lng, radius } = await req.json();

    if (!name || !lat || !lng) {
      return NextResponse.json({ success: false, message: "name, lat, lng majburiy" }, { status: 400 });
    }

    // Mavjud bo'lsa yangilash, bo'lmasa yaratish
    const company = await getDefaultCompanyId();
    const location = await OfficeLocation.findOneAndUpdate(
      {},
      { name, lat, lng, radius: radius || 100, company },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: location });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Xatolik yuz berdi' }, { status: 500 });
  }
}