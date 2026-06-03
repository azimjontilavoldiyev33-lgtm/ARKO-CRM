import Company from '@/models/Company';

// Hozircha tizimda BITTA korxona bor (single-tenant).
// Yo'q bo'lsa avtomatik yaratadi va shu korxona ID'sini qaytaradi.
// Ko'p-ijaraga (multi-tenant) o'tishda: bu funksiya o'rniga
// foydalanuvchi/token'dan kelgan companyId ishlatiladi.
let cachedId: string | null = null;

export async function getDefaultCompanyId(): Promise<string> {
  if (cachedId) return cachedId;
  let company = await Company.findOne();
  if (!company) {
    company = await Company.create({ name: process.env.COMPANY_NAME || 'Korxona' });
  }
  cachedId = String(company._id);
  return cachedId;
}
