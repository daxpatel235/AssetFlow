import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Role } from '@prisma/client';
import { env } from './env';
import { ApiError } from './api-error';

// httpOnly-cookie session with a jose-signed JWT (edge-compatible, unlike
// jsonwebtoken). The token never touches JS-readable storage → immune to XSS
// exfiltration, unlike a localStorage token.
export const SESSION_COOKIE = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const secret = new TextEncoder().encode(env.JWT_SECRET);

export type SessionUser = { id: string; name: string; email: string; role: Role };

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Verify a raw token (also used by middleware in the edge runtime).
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.sub),
      name: String(payload.name ?? ''),
      email: String(payload.email ?? ''),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

// Throwing guards for use inside route handlers.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw ApiError.unauthorized('Sign in to continue.');
  return user;
}

export function requireRole(user: SessionUser, ...roles: Role[]): void {
  if (!roles.includes(user.role)) throw ApiError.forbidden('Insufficient role.');
}
