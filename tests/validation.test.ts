import { describe, it, expect } from 'vitest';
import {
  workerCreateSchema,
  orderCreateSchema,
  officeLocationSchema,
  mobileLoginSchema,
} from '@/lib/validation';

describe('workerCreateSchema', () => {
  it('to\'g\'ri ishchini qabul qiladi', () => {
    const r = workerCreateSchema.safeParse({
      fullName: 'Ali Valiyev',
      phoneNumber: '+998901234567',
      salary: 5000000,
    });
    expect(r.success).toBe(true);
  });

  it('ismsiz rad etadi', () => {
    const r = workerCreateSchema.safeParse({ phoneNumber: '+998901234567' });
    expect(r.success).toBe(false);
  });

  it('begona maydonlarni (company) tashlab yuboradi (mass-assignment himoyasi)', () => {
    const r = workerCreateSchema.safeParse({
      fullName: 'Ali',
      phoneNumber: '+998901234567',
      company: 'BOSHQA_KORXONA_ID',
      code: '0000',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty('company');
      expect(r.data).not.toHaveProperty('code');
    }
  });

  it('manfiy maoshni rad etadi', () => {
    const r = workerCreateSchema.safeParse({ fullName: 'A', phoneNumber: '12345', salary: -100 });
    expect(r.success).toBe(false);
  });
});

describe('orderCreateSchema', () => {
  it('noto\'g\'ri status rad etiladi', () => {
    const r = orderCreateSchema.safeParse({
      title: 'Shkaf', clientName: 'Mijoz', deadline: '2026-07-01', status: 'hacked',
    });
    expect(r.success).toBe(false);
  });

  it('sana matnini Date ga keltiradi', () => {
    const r = orderCreateSchema.safeParse({ title: 'Shkaf', clientName: 'Mijoz', deadline: '2026-07-01' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.deadline).toBeInstanceOf(Date);
  });
});

describe('officeLocationSchema', () => {
  it('diapazondan tashqari koordinatani rad etadi', () => {
    const r = officeLocationSchema.safeParse({ name: 'Ofis', lat: 200, lng: 69 });
    expect(r.success).toBe(false);
  });

  it('to\'g\'ri koordinatani qabul qiladi', () => {
    const r = officeLocationSchema.safeParse({ name: 'Ofis', lat: 41.3, lng: 69.2, radius: 150 });
    expect(r.success).toBe(true);
  });
});

describe('mobileLoginSchema', () => {
  it('4 xonali kodsiz rad etadi', () => {
    const r = mobileLoginSchema.safeParse({ phoneNumber: '+998901234567', code: '12', deviceId: 'dev-1' });
    expect(r.success).toBe(false);
  });

  it('to\'g\'ri kirishni qabul qiladi', () => {
    const r = mobileLoginSchema.safeParse({ phoneNumber: '+998901234567', code: '4821', deviceId: 'dev-1' });
    expect(r.success).toBe(true);
  });
});
