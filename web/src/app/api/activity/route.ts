import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { route } from '@/lib/api-error';

// GET /api/activity?limit=&action=  — recent audit entries.
export const GET = route(async (req: Request) => {
  await requireUser();
  const params = new URL(req.url).searchParams;
  const limit = Math.min(Number(params.get('limit')) || 50, 200);
  const action = params.get('action') || undefined;

  const data = await prisma.activityLog.findMany({
    where: action ? { action: action as 'create' | 'update' | 'delete' } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json({ data });
});
