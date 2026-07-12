import { prisma } from './prisma';

// Create an in-app notification for a user (surfaces in the topbar bell).
//   await notify(user.id, { title: 'Order approved', body: '#1234', link: '/orders' });
export async function notify(userId: string, input: { title: string; body?: string; link?: string }): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, ...input } });
  } catch (err) {
    console.error('notify failed:', err);
  }
}
