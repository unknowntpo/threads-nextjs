import { withAuth } from 'next-auth/middleware';

// NextAuth v4 middleware - runs in Edge Runtime
export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: '/auth/login',
  },
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth).*)'],
};
