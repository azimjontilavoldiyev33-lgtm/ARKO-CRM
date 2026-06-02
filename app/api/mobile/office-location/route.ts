import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OfficeLocation from '@/models/OfficeLocation';

// GET /api/mobile/office-location — mobil ilova uchun ofis hududi
export async function GET() {
  try {
    await connectDB();
    const office = await OfficeLocation.findOne();

    if (!office) {
      return NextResponse.json(
        { success: false, message: 'Ofis joylashuvi sozlanmagan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: office._id,
        name: office.name,
        lat: office.lat,
        lng: office.lng,
        radius: office.radius,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
