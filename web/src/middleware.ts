import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { env } from '@/lib/env';

// Edge middleware: gate protected PAGES (redirect to /login) and bounce
// signed-in users away from auth pages. API routes guard themselves via
// requireUser() so they can return proper 401 JSON.
//
// The whole app is private by default: anything that isn't an explicitly
// PUBLIC page requires a valid session. New authenticated pages are therefore
// protected automatically — no need to touch this list when adding a screen.
const secret = new TextEncoder().encode(env.JWT_SECRET);
const PUBLIC = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/about', '/qa'];
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

async function isValid(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const valid = await isValid(req.cookies.get('session')?.value);

  // Signed-in users shouldn't linger on auth pages.
  if (AUTH_PAGES.includes(pathname) && valid) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Everything that isn't public requires a session.
  if (!PUBLIC.includes(pathname) && !valid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every page route except Next internals, API (self-guarded) and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
