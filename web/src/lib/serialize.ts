import type { User, Item } from '@prisma/client';

// Strip secrets / convert non-JSON types before sending to the client.
export function publicUser(u: User) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatarUrl };
}

// Prisma Decimal → number so the client gets plain JSON.
export function publicItem(i: Item) {
  return { ...i, price: Number(i.price) };
}

export type PublicUser = ReturnType<typeof publicUser>;
export type PublicItem = ReturnType<typeof publicItem>;
