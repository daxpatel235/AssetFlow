import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { route } from '@/lib/api-error';

export const POST = route(async () => {
  await destroySession();
  return NextResponse.json({ message: 'Signed out' });
});
