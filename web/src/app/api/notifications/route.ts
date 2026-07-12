import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { route } from '@/lib/api-error';

// GET /api/notifications  — the current user's latest notifications.
export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const limit = Math.min(Number(new URL(req.url).searchParams.get('limit')) || 20, 100);
  const data = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json({ data });
});

// PATCH /api/notifications  — mark all of the user's notifications read.
export const PATCH = route(async () => {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return NextResponse.json({ message: 'All marked read' });
});
