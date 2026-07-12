import type { ActivityAction } from '@prisma/client';
import { prisma } from './prisma';

// Fire-and-forget audit entry. Never let logging break the request.
export async function logActivity(input: {
  action: ActivityAction;
  entity: string;
  entityId?: string;
  summary?: string;
  userId?: string;
  userName?: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({ data: input });
  } catch (err) {
    console.error('activity log failed:', err);
  }
}
