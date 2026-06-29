import { z } from 'zod';
import { NextResponse } from 'next/server';

// API write-endpoint'lari uchun markazlashgan kirish sxemalari (zod).
// Mass-assignment va noto'g'ri ma'lumotning bazaga tushishini oldini oladi.

// ── Umumiy bo'laklar ──────────────────────────────────────────
const trimmed = z.string().trim();
const phone = trimmed.min(5, 'Telefon raqam juda qisqa').max(30);
const fourDigitCode = z.string().regex(/^\d{4}$/, '4 xonali kod bo\'lishi kerak');
const positiveAmount = z.coerce.number().finite().min(0).max(1e12);

// ── Worker ────────────────────────────────────────────────────
export const workerCreateSchema = z.object({
  fullName: trimmed.min(1, 'Ism majburiy').max(120),
  phoneNumber: phone,
  telegramChatId: trimmed.max(60).optional().nullable(),
  position: trimmed.max(80).optional().nullable(),
  salary: positiveAmount.optional(),
});

export const workerUpdateSchema = z.object({
  fullName: trimmed.min(1).max(120).optional(),
  phoneNumber: phone.optional(),
  telegramChatId: trimmed.max(60).optional().nullable(),
  position: trimmed.max(80).optional().nullable(),
  salary: positiveAmount.optional(),
  resetDevice: z.boolean().optional(),
});

// ── Order ─────────────────────────────────────────────────────
const orderStatus = z.enum(['new', 'in_progress', 'completed']);

export const orderCreateSchema = z.object({
  title: trimmed.min(1, 'Sarlavha majburiy').max(200),
  clientName: trimmed.min(1, 'Mijoz ismi majburiy').max(120),
  deadline: z.coerce.date(),
  status: orderStatus.optional(),
  amount: positiveAmount.optional(),
  images: z.array(z.string().url()).max(20).optional(),
});

export const orderUpdateSchema = z.object({
  title: trimmed.min(1).max(200).optional(),
  clientName: trimmed.min(1).max(120).optional(),
  deadline: z.coerce.date().optional(),
  status: orderStatus.optional(),
  amount: positiveAmount.optional(),
  images: z.array(z.string().url()).max(20).optional(),
});

// ── Office location ───────────────────────────────────────────
export const officeLocationSchema = z.object({
  name: trimmed.min(1, 'Nom majburiy').max(120),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(10).max(10000).optional(),
});

// ── Settings ──────────────────────────────────────────────────
export const settingsSchema = z.object({
  pointValue: positiveAmount.optional(),
  telegramChatId: trimmed.max(60).optional().nullable(),
});

// ── Mobile login ──────────────────────────────────────────────
export const mobileLoginSchema = z.object({
  phoneNumber: phone,
  code: fourDigitCode,
  deviceId: trimmed.min(1, 'Qurilma aniqlanmadi').max(200),
});

// ── Yordamchi: parse qilib, xato bo'lsa 400 javob qaytaradi ──
type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): ParseResult<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg = result.error.issues[0]?.message || "Noto'g'ri ma'lumot";
    return { ok: false, response: NextResponse.json({ error: msg }, { status: 400 }) };
  }
  return { ok: true, data: result.data };
}
