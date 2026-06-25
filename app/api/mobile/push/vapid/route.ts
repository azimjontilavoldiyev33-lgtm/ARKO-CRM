import { NextResponse } from 'next/server';

// GET /api/mobile/push/vapid — push obuna uchun VAPID public key (oshkor bo'lishi xavfsiz)
export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}
