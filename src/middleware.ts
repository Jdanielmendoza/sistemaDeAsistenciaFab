import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';
import { JWT_SECRET_STRING } from '@/lib/env';

const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get('token')?.value;
  const decodedUser = token ? await verifyJwt(token) : null;
  const isAuthenticated = Boolean(decodedUser);

  // Server-side redirects for app routes
  const isDashboard = pathname.startsWith('/dashboard');
  const isLogin = pathname === '/login';
  const isRoot = pathname === '/';

  if (isDashboard && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if ((isLogin || isRoot) && isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isRoot && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // For API routes, attach decoded user to request headers if available
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);
    if (decodedUser) {
      requestHeaders.set('user', JSON.stringify(decodedUser));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/',
    '/login',
    '/dashboard/:path*',
  ],
};
