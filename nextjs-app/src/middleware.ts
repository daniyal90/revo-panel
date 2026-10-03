import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect dashboard and admin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // if token present but not approved, redirect to pending approval page
    const status = (token as any).status;
    if (status && status !== 'APPROVED') {
      const allowed = ['/pending-approval', '/logout', '/api/auth'];
      if (!allowed.some(p => pathname.startsWith(p))) {
        const url = req.nextUrl.clone();
        url.pathname = '/pending-approval';
        return NextResponse.redirect(url);
      }
    }

    // restrict /admin to admins only
    if (pathname.startsWith('/admin')) {
      const role = (token as any).role;
      if (role !== 'ADMIN') {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/admin/:path*'],
};
