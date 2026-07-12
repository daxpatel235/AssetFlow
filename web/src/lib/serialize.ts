import type { User } from '@prisma/client';

// Strip secrets / convert non-JSON types before sending to the client.
export function publicUser(u: User) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatarUrl };
}

export type PublicUser = ReturnType<typeof publicUser>;
