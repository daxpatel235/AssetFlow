import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Readiness probe (Wolf ERP pattern). `/api/health` reports the DB connection
// so an uptime monitor / load balancer catches a half-dead instance instead of
// seeing a green "ok" while every data request hangs. Returns 503 when the DB
// is unreachable. Never cached — always reflects live state.
export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    // Cheapest possible round-trip that proves the pool can reach Postgres.
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json(
    {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'connected' : 'unreachable',
      latencyMs: Date.now() - started,
      uptime: Math.round(process.uptime()),
      time: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 }
  );
}
