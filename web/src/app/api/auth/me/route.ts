import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { route } from '@/lib/api-error';

export const GET = route(async () => {
  const user = await getSession();
  return NextResponse.json({ user });
});
