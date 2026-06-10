import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Company from '@/models/Company';
import { getAuth } from '@/lib/auth';

// GET /api/me — kirgan adminning login + korxona nomi (sidebar konteksti uchun)
export async function GET() {
  const auth = await getAuth();
  if (!auth?.adminId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  await connectDB();

  const admin = await Admin.findById(auth.adminId).select('username role');
  let companyName = '';
  let pointValue = 0;
  if (auth.companyId) {
    const company = await Company.findById(auth.companyId).select('name pointValue');
    companyName = company?.name || '';
    pointValue = company?.pointValue || 0;
  }

  return NextResponse.json({
    username: admin?.username || 'Admin',
    role: auth.role,
    companyName,
    plan: auth.plan,
    pointValue,
  });
}
