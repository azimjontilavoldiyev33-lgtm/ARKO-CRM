import { describe, it, expect } from 'vitest';
import { computeBill, BILLING } from '@/lib/billing';

describe('computeBill', () => {
  it('20 ishchigacha bazaviy narx ($50)', () => {
    expect(computeBill(0).total).toBe(50);
    expect(computeBill(1).total).toBe(50);
    expect(computeBill(20).total).toBe(50);
  });

  it('20 dan oshganda har ishchi uchun +$2.5', () => {
    expect(computeBill(21).total).toBe(52.5);
    expect(computeBill(25).total).toBe(62.5);
    expect(computeBill(30).total).toBe(75);
    expect(computeBill(40).total).toBe(100);
  });

  it('breakdown to\'g\'ri qaytadi', () => {
    const b = computeBill(30);
    expect(b.extraWorkers).toBe(10);
    expect(b.extraCost).toBe(25);
    expect(b.base).toBe(BILLING.basePriceUsd);
  });

  it('manfiy/noto\'g\'ri kirishni xavfsiz qayta ishlaydi', () => {
    expect(computeBill(-5).total).toBe(50);
    expect(computeBill(NaN).total).toBe(50);
  });
});
