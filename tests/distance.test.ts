import { describe, it, expect } from 'vitest';
import { distanceInMeters } from '@/lib/distance';

describe('distanceInMeters (Haversine)', () => {
  it('bir xil nuqta uchun 0 qaytaradi', () => {
    expect(distanceInMeters(41.3, 69.2, 41.3, 69.2)).toBe(0);
  });

  it('yaqin masofani taxminan to\'g\'ri hisoblaydi (~111m / 0.001°)', () => {
    const d = distanceInMeters(41.3111, 69.2797, 41.3121, 69.2797);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(125);
  });

  it('Toshkent–Samarqand masofasi ~270 km atrofida', () => {
    const d = distanceInMeters(41.2995, 69.2401, 39.627, 66.975);
    expect(d).toBeGreaterThan(250_000);
    expect(d).toBeLessThan(290_000);
  });

  it('simmetrik — yo\'nalish ahamiyatsiz', () => {
    const a = distanceInMeters(41.3, 69.2, 40.0, 65.0);
    const b = distanceInMeters(40.0, 65.0, 41.3, 69.2);
    expect(a).toBeCloseTo(b, 5);
  });
});
