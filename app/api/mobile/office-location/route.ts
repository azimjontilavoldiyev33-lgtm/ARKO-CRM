import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import OfficeLocation from '@/models/OfficeLocation';
import Worker from '@/models/Worker';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';

// GET /api/mobile/office-location — mobil ilova uchun ofis hududi
// Ishchining O'Z korxonasi ofisini qaytaradi (ko'p-ijara aralashmasligi uchun).
export async function GET(req: NextRequest) {
  try {
    const workerId = await getWorkerIdFromRequest(req);
    if (!workerId) {
      return NextResponse.json(
        { success: false, message: 'Avtorizatsiya talab qilinadi' },
        { status: 401 }
      );
    }

    await connectDB();
    const worker = await Worker.findById(workerId).select('company');
    const office = worker?.company
      ? await OfficeLocation.findOne({ company: worker.company })
      : null;

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
