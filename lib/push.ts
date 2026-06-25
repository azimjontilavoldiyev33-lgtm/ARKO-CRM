import webpush from 'web-push';
import { connectDB } from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false; // kalitlar yo'q — push o'chiq, lekin ilova ishlayveradi
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@tabel.app', pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// Bitta ishchining barcha qurilmalariga push yuboradi. O'lik obunalar (410/404)
// avtomatik o'chiriladi. Xato bo'lsa ham chaqiruvchi kod buzilmaydi (jim).
export async function sendPushToWorker(workerId: string, payload: PushPayload): Promise<void> {
  try {
    if (!ensureConfigured()) return;
    await connectDB();
    const subs = await PushSubscription.find({ worker: workerId });
    if (subs.length === 0) return;

    const data = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } },
            data
          );
        } catch (err: unknown) {
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            await PushSubscription.deleteOne({ _id: s._id }); // obuna eskirgan
          }
        }
      })
    );
  } catch {
    /* push xatosi asosiy oqimni buzmasin */
  }
}
