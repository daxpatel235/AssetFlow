import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { ApiError, route } from '@/lib/api-error';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { publicUser } from '@/lib/serialize';

export const POST = route(async (req: Request) => {
  rateLimit(`login:${clientIp(req)}`, { max: 20 });
  const { email, password } = loginSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  // A deactivated account must not be able to sign in even with valid creds.
  if (!user.isActive) {
    throw ApiError.forbidden('Your account is not active. Contact an administrator.');
  }

  // Stamp login activity. update() (not a full re-save) skips re-hashing the
  // password and only touches these two columns. Awaited so the row is
  // consistent, but a failure here shouldn't block a valid sign-in — swallow it.
  await prisma.user
    .update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
    })
    .catch(() => {});

  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json({ user: publicUser(user) });
});
