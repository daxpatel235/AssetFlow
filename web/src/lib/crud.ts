import type { ListQuery } from './validation';

// Shared list logic (search/filter/sort/paginate) reused by every resource
// route. Prisma stays fully typed at the call site; this just builds the args.
export type ListConfig = {
  searchFields?: string[];
  filterFields?: string[];
  defaultSort?: string; // 'name' (asc) or '-createdAt' (desc)
  ownerField?: string; // e.g. 'createdById' → scopes rows to the current user
};

export function buildListArgs(query: ListQuery, config: ListConfig, ownerId?: string) {
  const where: Record<string, unknown> = {};

  if (config.ownerField && ownerId) where[config.ownerField] = ownerId;

  if (query.q && config.searchFields?.length) {
    where.OR = config.searchFields.map((f) => ({ [f]: { contains: query.q, mode: 'insensitive' } }));
  }

  for (const f of config.filterFields ?? []) {
    const v = (query as Record<string, unknown>)[f];
    if (v !== undefined && v !== '') where[f] = v;
  }

  const sortStr = query.sort || config.defaultSort || '-createdAt';
  const desc = sortStr.startsWith('-');
  const field = desc ? sortStr.slice(1) : sortStr;
  const orderBy: Record<string, 'asc' | 'desc'> = { [field]: desc ? 'desc' : 'asc' };

  return { where, orderBy, skip: (query.page - 1) * query.limit, take: query.limit };
}

export function paginated<T>(data: T[], total: number, query: ListQuery) {
  return { data, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
}
