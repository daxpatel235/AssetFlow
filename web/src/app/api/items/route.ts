import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { itemCreateSchema, listQuerySchema } from '@/lib/validation';
import { buildListArgs, paginated } from '@/lib/crud';
import { logActivity } from '@/lib/activity';
import { publicItem } from '@/lib/serialize';
import { route } from '@/lib/api-error';

const LIST = { searchFields: ['name', 'sku'], filterFields: ['status'], ownerField: 'createdById' };

// GET /api/items?q=&page=&limit=&sort=&status=
export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const query = listQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const args = buildListArgs(query, LIST, user.id);

  const where = args.where as Prisma.ItemWhereInput;
  const [rows, total] = await Promise.all([
    prisma.item.findMany({ where, orderBy: args.orderBy as Prisma.ItemOrderByWithRelationInput, skip: args.skip, take: args.take }),
    prisma.item.count({ where }),
  ]);

  return NextResponse.json(paginated(rows.map(publicItem), total, query));
});

// POST /api/items
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const data = itemCreateSchema.parse(await req.json());

  const item = await prisma.item.create({ data: { ...data, createdById: user.id } });
  await logActivity({ action: 'create', entity: 'items', entityId: item.id, summary: item.name, userId: user.id, userName: user.name });

  return NextResponse.json(publicItem(item), { status: 201 });
});
