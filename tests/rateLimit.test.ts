import { describe, it, expect } from 'vitest';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// UPSTASH env sozlanmagani uchun in-memory rejim sinaladi.

describe('rateLimit (in-memory)', () => {
  it('limitgacha ruxsat beradi, keyin bloklaydi', async () => {
    const key = `test:${Math.random()}`;
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      const r = await rateLimit(key, limit, 60_000);
      expect(r.ok).toBe(true);
    }
    const blocked = await rateLimit(key, limit, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('alohida kalitlar bir-biriga ta\'sir qilmaydi', async () => {
    const a = await rateLimit(`a:${Math.random()}`, 1, 60_000);
    const b = await rateLimit(`b:${Math.random()}`, 1, 60_000);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it('oyna tugagach qayta tiklanadi', async () => {
    const key = `win:${Math.random()}`;
    expect((await rateLimit(key, 1, 30)).ok).toBe(true);
    expect((await rateLimit(key, 1, 30)).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 40));
    expect((await rateLimit(key, 1, 30)).ok).toBe(true);
  });
});

describe('clientIp', () => {
  it('x-forwarded-for dagi birinchi IP ni oladi', () => {
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } });
    expect(clientIp(req)).toBe('1.2.3.4');
  });

  it('header bo\'lmasa "unknown" qaytaradi', () => {
    expect(clientIp(new Request('http://x'))).toBe('unknown');
  });
});
