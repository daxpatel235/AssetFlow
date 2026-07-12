import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { ApiError, route } from '@/lib/api-error';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { publicUser } from '@/lib/serialize';

export const POST = route(async (req: Request) => {
  rateLimit(`register:${clientIp(req)}`, { max: 10 });
  const { name, email, password } = registerSchema.parse(await req.json());

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw ApiError.conflict('Email already registered.');

  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password), role: 'employee' },
  });

  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
});
