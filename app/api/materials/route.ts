import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Material from '@/models/Material';
import StockMovement from '@/models/StockMovement';
import { getAuth } from '@/lib/auth';

 

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// GET /api/materials — korxona materiallari ro'yxati (Pro-only)
export async function GET() {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();
  const materials = await Material.find({ company: auth.companyId }).sort({ name: 1 });
  return NextResponse.json(materials);
}

// POST /api/materials — yangi material (boshlang'ich qoldiq bo'lsa kirim yozuvi ham yaratiladi)
export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth?.companyId) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  if (auth.plan !== 'pro') return NextResponse.json({ error: 'Bu funksiya Pro tarifda mavjud' }, { status: 403 });
  await connectDB();
  const body = await req.json();

  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Material nomi shart' }, { status: 400 });
  const quantity = Math.max(0, num(body.quantity));

  const material = await Material.create({
    company: auth.companyId,
    name,
    unit: (body.unit || 'dona').trim() || 'dona',
    quantity,
    minQuantity: Math.max(0, num(body.minQuantity)),
    price: Math.max(0, Math.round(num(body.price))),
  });

  // Boshlang'ich qoldiq tarixda ko'rinsin
  if (quantity > 0) {
    await StockMovement.create({
      company: auth.companyId,
      material: material._id,
      type: 'in',
      quantity,
      note: "Boshlang'ich qoldiq",
    });
  }

  return NextResponse.json(material, { status: 201 });
}
