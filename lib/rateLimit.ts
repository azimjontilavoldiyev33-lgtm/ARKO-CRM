// Rate-limiter: brute-force'ni sekinlashtirish uchun.
//
// Ikki rejim (avtomatik tanlanadi):
//  1) Distributed — UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN sozlangan bo'lsa,
//     Upstash Redis REST orqali (SDK'siz, oddiy fetch). Ko'p instansli serverless uchun TO'G'RI.
//  2) In-memory — env sozlanmagan bo'lsa, har instance alohida hisoblaydi (baza himoya).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

// ── In-memory rejim ──────────────────────────────────────────
function memoryLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

// ── Upstash Redis (distributed) rejim ────────────────────────
async function redisLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfter: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  // Bitta so'rovda: INCR (oshir), PEXPIRE NX (faqat birinchi marta TTL qo'y), PTTL (qolgan vaqt)
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, windowMs, 'NX'],
      ['PTTL', key],
    ]),
    // Limiter sekinlashmasligi uchun qisqa timeout
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) throw new Error(`Upstash xato: ${res.status}`);
  const data = (await res.json()) as { result: number }[];
  const count = Number(data[0]?.result ?? 0);
  const ttl = Number(data[2]?.result ?? windowMs);
  if (count > limit) {
    return { ok: false, retryAfter: Math.ceil(ttl / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

/**
 * @param key      Noyob kalit (masalan, `mlogin:<ip>`)
 * @param limit    Oyna ichidagi maksimal urinishlar
 * @param windowMs Oyna davomiyligi (ms)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfter: number }> {
  if (hasRedis) {
    try {
      return await redisLimit(key, limit, windowMs);
    } catch {
      // Redis ishlamasa — in-memory'ga tushib, xizmatni to'xtatmaymiz (fail-open emas, fail-soft)
      return memoryLimit(key, limit, windowMs);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

// So'rovdan mijoz IP manzilini olish (proxy header'lari orqali)
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
