import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { route } from '@/lib/api-error';
import { runAction } from '@/lib/server/assetflow-service';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/actions — the single mutation entrypoint.
// Body: { action: string, payload?: unknown }. The session (not the client)
// decides who the actor is; the service enforces RBAC + validation and returns
// a small ack. The client then refetches /api/bootstrap to reflect new state.
// ─────────────────────────────────────────────────────────────────────────────

const Body = z.object({ action: z.string().min(1), payload: z.unknown().optional() });

export const POST = route(async (req: Request) => {
  const actor = await requireUser();
  const { action, payload } = Body.parse(await req.json());
  const result = await runAction(actor, action, payload);
  return NextResponse.json({ ok: true, result });
});
