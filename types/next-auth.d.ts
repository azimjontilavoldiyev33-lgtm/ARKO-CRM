import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    companyId?: string | null;
    role?: 'admin' | 'superadmin';
    adminId?: string;
  }
  interface User {
    companyId?: string | null;
    role?: 'admin' | 'superadmin';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    companyId?: string | null;
    role?: 'admin' | 'superadmin';
    adminId?: string;
  }
}
