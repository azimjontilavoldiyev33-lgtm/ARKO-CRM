import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Login', type: 'text' },
        password: { label: 'Parol', type: 'password' },
      },
      async authorize(credentials) {
        const adminUser = process.env.ADMIN_USERNAME || 'admin';
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

        if (
          credentials?.username === adminUser &&
          credentials?.password === adminPass
        ) {
          return { id: '1', name: 'Admin', email: 'admin@mebelcrm.uz' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 kun
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };