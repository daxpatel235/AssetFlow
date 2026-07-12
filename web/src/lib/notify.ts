import { prisma } from './prisma';

// Create an in-app notification for a user (surfaces in the topbar bell).
// `kind` drives the icon in the bell/list UI; omit it to fall back to "info".
//   await notify(user.id, { kind: 'asset_assigned', title: 'Asset assigned', body: '…' });
export async function notify(userId: string, input: { kind?: string; title: string; body?: string; link?: string }): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, ...input } });
  } catch (err) {
    console.error('notify failed:', err);
  }
}
