import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { ApiError, route } from '@/lib/api-error';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { publicUser } from '@/lib/serialize';

const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

// POST /api/auth/reset-password
export const POST = route(async (req: Request) => {
  rateLimit(`reset:${clientIp(req)}`, { max: 10 });
  const { token, password } = resetPasswordSchema.parse(await req.json());

  // Look the user up by the HASHED token and ensure it hasn't expired.
  const user = await prisma.user.findFirst({
    where: { resetToken: hashToken(token), resetTokenExpires: { gt: new Date() } },
  });
  if (!user) {
    throw ApiError.badRequest('This reset link is invalid or has expired. Please request a new one.');
  }

  // Set the new password and burn the token so the link can't be reused.
  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(password), resetToken: null, resetTokenExpires: null },
  });

  // Log them straight in so they don't have to re-enter the new password.
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json({ message: 'Your password has been reset.', user: publicUser(user) });
});
