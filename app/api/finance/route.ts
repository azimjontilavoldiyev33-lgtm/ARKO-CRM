import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Worker from '@/models/Worker';
import { getAuth } from '@/lib/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

function monthRange(y: number, m: number) {
  return { from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 1)) };
}

// GET /api/finance?month=&year=  — Pro-only, oylik moliya + 6 oylik trend
export async function GET(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get('month') || '') || now.getUTCMonth() + 1;
  const year = parseInt(searchParams.get('year') || '') || now.getUTCFullYear();

  // Oylik fond = ustalar maoshi yig'indisi (joriy ro'yxat)
  const workers = await Worker.find({ company: auth.companyId }).select('salary');
  const payroll = (workers as any[]).reduce((s, w) => s + (w.salary || 0), 0);

  // 6 oylik oyna boshi
  let wy = year, wm = month - 5;
  while (wm <= 0) { wm += 12; wy -= 1; }
  const windowFrom = monthRange(wy, wm).from;

  const allTx = await Transaction.find({ company: auth.companyId, date: { $gte: windowFrom } }).sort({ date: -1 });

  // Tanlangan oy yozuvlari
  const { from, to } = monthRange(year, month);
  const monthTx = (allTx as any[]).filter((t) => { const d = new Date(t.date); return d >= from && d < to; });
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Oylik fond faqat FAOL oyga (yozuv bor) yoki JORIY oyga qo'llanadi —
  // ma'lumotsiz o'tgan oylar grafikda soxta zarar ko'rsatmasligi uchun.
  const nowD = new Date();
  const nowMonth = nowD.getUTCMonth() + 1, nowYear = nowD.getUTCFullYear();
  const effPayroll = (y: number, m: number, inc: number, exp: number) =>
    (y === nowYear && m === nowMonth) || inc > 0 || exp > 0 ? payroll : 0;
  const monthPayroll = effPayroll(year, month, income, expense);

  // Trend (6 oy, tanlangan oy oxirgi)
  const trend: any[] = [];
  for (let i = 5; i >= 0; i--) {
    let ty = year, tm = month - i;
    while (tm <= 0) { tm += 12; ty -= 1; }
    const r = monthRange(ty, tm);
    let inc = 0, exp = 0;
    for (const t of allTx as any[]) {
      const d = new Date(t.date);
      if (d >= r.from && d < r.to) { if (t.type === 'income') inc += t.amount; else exp += t.amount; }
    }
    const mp = effPayroll(ty, tm, inc, exp);
    trend.push({ label: MONTHS_SHORT[tm - 1], year: ty, month: tm, income: inc, expense: exp, payroll: mp, profit: inc - exp - mp });
  }

  return NextResponse.json({
    month, year,
    payroll: monthPayroll,
    income,
    expense,
    profit: income - expense - monthPayroll,
    transactions: monthTx.map((t) => ({
      _id: String(t._id),
      type: t.type,
      category: t.category,
      amount: t.amount,
      note: t.note,
      date: t.date,
    })),
    trend,
  });
}

// POST /api/finance — yozuv qo'shish
export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();

  const body = await req.json();
  const type = body.type === 'income' ? 'income' : body.type === 'expense' ? 'expense' : null;
  const amount = Math.round(Number(body.amount));
  if (!type) return NextResponse.json({ error: 'Tur noto\'g\'ri (income/expense)' }, { status: 400 });
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Summa noto\'g\'ri' }, { status: 400 });

  const tx = await Transaction.create({
    company: auth.companyId,
    type,
    category: (body.category || 'boshqa').trim(),
    amount,
    note: (body.note || '').trim(),
    date: body.date ? new Date(body.date) : new Date(),
  });

  return NextResponse.json({ ok: true, _id: String(tx._id) }, { status: 201 });
}
