import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Company from '@/models/Company';
import Admin from '@/models/Admin';
import Worker from '@/models/Worker';
import { getAuth } from '@/lib/auth';
import { computeBill } from '@/lib/billing';
import { reportError } from '@/lib/reportError';

// GET /api/superadmin/companies — barcha korxonalar + ishchi soni + oylik hisob.
// Faqat superadmin.
export async function GET() {
  const auth = await getAuth();
  if (auth?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Faqat superadmin' }, { status: 403 });
  }
  await connectDB();

  const companies = await Company.find().sort({ createdAt: -1 }).select('name plan isActive createdAt');

  // Korxona bo'yicha ishchi sonini bitta aggregate so'rovida olamiz
  const counts = await Worker.aggregate<{ _id: mongoose.Types.ObjectId | null; count: number }>([
    { $group: { _id: '$company', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const rows = companies.map((c) => {
    const workers = countMap.get(String(c._id)) || 0;
    return {
      _id: String(c._id),
      name: c.name,
      plan: c.plan,
      isActive: c.isActive,
      createdAt: c.createdAt,
      bill: computeBill(workers),
    };
  });

  const totalUsd = rows.reduce((s, r) => s + r.bill.total, 0);
  const totalWorkers = rows.reduce((s, r) => s + r.bill.workers, 0);

  return NextResponse.json({ companies: rows, totalUsd, totalWorkers });
}

// POST /api/superadmin/companies — yangi korxona + birinchi admin yaratish (onboarding).
// Faqat superadmin.
export async function POST(req: Request) {
  const auth = await getAuth();
  if (auth?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Faqat superadmin' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name || '').trim();
  const plan = body?.plan === 'basic' ? 'basic' : 'pro';
  const username = String(body?.adminUsername || '').trim();
  const password = String(body?.adminPassword || '');

  if (!name || !username || password.length < 6) {
    return NextResponse.json(
      { error: "Korxona nomi, admin login va kamida 6 belgili parol majburiy" },
      { status: 400 }
    );
  }

  await connectDB();

  // Login band emasligini tekshiramiz
  const exists = await Admin.findOne({ username }).select('_id');
  if (exists) {
    return NextResponse.json({ error: 'Bu login allaqachon band' }, { status: 400 });
  }

  try {
    const company = await Company.create({ name, plan, isActive: true });
    const admin = await Admin.create({
      username,
      passwordHash: await bcrypt.hash(password, 10),
      company: company._id,
      role: 'admin',
      isActive: true,
    });
    return NextResponse.json(
      { ok: true, companyId: String(company._id), adminId: String(admin._id) },
      { status: 201 }
    );
  } catch (err) {
    reportError('POST /api/superadmin/companies', err);
    return NextResponse.json({ error: 'Xato yuz berdi' }, { status: 500 });
  }
}
