import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';
import Worker from '@/models/Worker';
import { getWorkerIdFromRequest } from '@/lib/mobileAuth';

// POST /api/mobile/push/subscribe — ishchi qurilmasini push uchun ro'yxatga oladi
export async function POST(req: NextRequest) {
  const workerId = await getWorkerIdFromRequest(req);
  if (!workerId) {
    return NextResponse.json({ success: false, message: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }

  const sub = await req.json();
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ success: false, message: "Noto'g'ri obuna" }, { status: 400 });
  }

  await connectDB();
  const worker = await Worker.findById(workerId).select('company');

  // endpoint bo'yicha upsert — bir qurilma bir marta, ishchiga bog'lab qo'yiladi
  await PushSubscription.findOneAndUpdate(
    { endpoint: sub.endpoint },
    {
      worker: workerId,
      company: worker?.company ?? null,
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true });
}
