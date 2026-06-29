import { SignJWT, jwtVerify } from 'jose';

// Mobil ilova uchun JWT token (admin next-auth'dan alohida).
// next-auth bilan bir xil maxfiy kalitdan foydalanamiz.
// Zaif fallback YO'Q — secret sozlanmagan bo'lsa ishga tushmaydi (xavfsizlik).
// MUHIM: tekshiruv modul yuklanishida emas, ishlatilganda bajariladi — aks holda
// build vaqtida (env'siz) butun import qulaydi (qarang: lib/mongodb.ts).
function getSecret(): Uint8Array {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) {
    throw new Error('NEXTAUTH_SECRET sozlanmagan — mobil JWT uchun majburiy');
  }
  return new TextEncoder().encode(value);
}

// Ishchi uchun token chiqarish (login paytida)
export async function signWorkerToken(workerId: string): Promise<string> {
  return await new SignJWT({ workerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());
}

// So'rovdagi Bearer tokendan workerId ni olish (himoyalangan route'lar uchun).
// Token yo'q yoki noto'g'ri bo'lsa — null.
export async function getWorkerIdFromRequest(req: Request): Promise<string | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.workerId as string) || null;
  } catch {
    return null;
  }
}
