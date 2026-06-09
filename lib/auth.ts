import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Company from '@/models/Company';
import { getDefaultCompanyId } from '@/lib/company';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Login', type: 'text' },
        password: { label: 'Parol', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        await connectDB();
        const username = credentials.username.trim();

        let admin = await Admin.findOne({ username });

        // Bootstrap: birinchi marta — .env dagi admin'ni superadmin sifatida yaratamiz
        if (!admin) {
          const envUser = process.env.ADMIN_USERNAME || 'admin';
          const envPass = process.env.ADMIN_PASSWORD || 'admin123';
          const anyAdmin = await Admin.findOne();
          if (!anyAdmin && username === envUser && credentials.password === envPass) {
            const company = await getDefaultCompanyId();
            admin = await Admin.create({
              username: envUser,
              passwordHash: await bcrypt.hash(envPass, 10),
              company,
              role: 'superadmin',
              isActive: true,
            });
          }
        }

        if (!admin || !admin.isActive) return null;

        const ok = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!ok) return null;

        // Oddiy admin uchun korxona faol bo'lishi shart (superadmin har doim kira oladi).
        // isActive maydoni yo'q (eski hujjat) bo'lsa — faol deb hisoblanadi; faqat aniq
        // o'chirilgan (isActive === false) korxonaga kirish bloklanadi.
        if (admin.role !== 'superadmin') {
          if (!admin.company) return null;
          const company = await Company.findById(admin.company);
          if (!company || company.isActive === false) return null;
        }

        return {
          id: String(admin._id),
          name: admin.username,
          companyId: admin.company ? String(admin.company) : null,
          role: admin.role,
        };
      },
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.companyId = user.companyId ?? null;
        token.role = user.role ?? 'admin';
        token.adminId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.companyId = token.companyId ?? null;
      session.role = token.role ?? 'admin';
      session.adminId = token.adminId;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export interface AuthInfo {
  companyId: string | null;
  role: 'admin' | 'superadmin';
  adminId: string;
  plan: 'basic' | 'pro';   // korxona tarifi (Pro-only funksiyalar uchun)
}

// Joriy admin sessiyasidan companyId / role / tarif olish (API route'larda ishlatiladi).
// Korxona FAOL bo'lishi har so'rovda tekshiriladi — control-plane korxonani o'chirsa,
// admin (ochiq sessiyasi bo'lsa ham) darhol bloklanadi.
export async function getAuth(): Promise<AuthInfo | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.role ?? 'admin') as 'admin' | 'superadmin';
  const adminId = session.adminId ?? '';
  const companyId = session.companyId ?? null;

  // Superadmin — korxona cheklovisiz, to'liq huquq
  if (role === 'superadmin') {
    return { companyId, role, adminId, plan: 'pro' };
  }

  // Oddiy admin — korxona mavjud va FAOL bo'lishi shart; tarif shu yerdan olinadi
  if (!companyId) return null;
  await connectDB();
  const company = await Company.findById(companyId).select('isActive plan');
  if (!company || company.isActive === false) return null;
  return { companyId, role, adminId, plan: company.plan === 'basic' ? 'basic' : 'pro' };
}
