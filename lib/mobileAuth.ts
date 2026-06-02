import { SignJWT, jwtVerify } from 'jose';

// Mobil ilova uchun JWT token (admin next-auth'dan alohida).
// next-auth bilan bir xil maxfiy kalitdan foydalanamiz.
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'dev_secret_change_me'
);

// Ishchi uchun token chiqarish (login paytida)
export async function signWorkerToken(workerId: string): Promise<string> {
  return await new SignJWT({ workerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

// So'rovdagi Bearer tokendan workerId ni olish (himoyalangan route'lar uchun).
// Token yo'q yoki noto'g'ri bo'lsa — null.
export async function getWorkerIdFromRequest(req: Request): Promise<string | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.workerId as string) || null;
  } catch {
    return null;
  }
}
