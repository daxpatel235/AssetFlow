import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { itemUpdateSchema } from '@/lib/validation';
import { logActivity } from '@/lib/activity';
import { publicItem } from '@/lib/serialize';
import { ApiError, route } from '@/lib/api-error';

type Ctx = { params: Promise<{ id: string }> };

// Ownership is enforced in the where-clause: another user's row simply 404s.
async function ownedItem(id: string, userId: string) {
  const item = await prisma.item.findFirst({ where: { id, createdById: userId } });
  if (!item) throw ApiError.notFound('Item not found');
  return item;
}

export const GET = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  return NextResponse.json(publicItem(await ownedItem(id, user.id)));
});

export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  await ownedItem(id, user.id);
  const data = itemUpdateSchema.parse(await req.json());

  const item = await prisma.item.update({ where: { id }, data });
  await logActivity({ action: 'update', entity: 'items', entityId: id, summary: item.name, userId: user.id, userName: user.name });
  return NextResponse.json(publicItem(item));
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const item = await ownedItem(id, user.id);

  await prisma.item.delete({ where: { id } });
  await logActivity({ action: 'delete', entity: 'items', entityId: id, summary: item.name, userId: user.id, userName: user.name });
  return NextResponse.json({ message: 'Deleted', id });
});
