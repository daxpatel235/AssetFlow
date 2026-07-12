# PROGRESS — live session baton

> The handoff between Claude sessions. **Every new session: read this first.**
> **Before you stop / switch sessions: update the sections below.** Keep it short.
> This also doubles as a build journal for judges.

## ✅ Pre-flight — fully verified 2026-07-12 (don't redo; just build features)
Everything problem-agnostic is done and proven working end to end:
- **Deps installed** (`npm install` clean) · **Playwright chromium** installed.
- **Local Postgres 18** running + **seeded** (hidden admin + **15** demo items: low-stock, archived, 14-day trend → dashboard looks alive).
- **Unit tests 9/9** · **lint clean** · **typecheck clean** · **prod build passes**.
- **e2e 3/3 green** (fixed stale seed creds + a login race in the spec).
- **Live app proven:** `/api/health` → `db:connected`; public pages 200; protected pages 307→login; authenticated login → `/dashboard`, `/items`, `/api/items`, `/api/items/stats` all 200.
- DB generator hardened: money = `Decimal(12,2)`, auto compound + FK indexes (don't hand-fix).

## 🔜 Next (in order — this is tomorrow's real work)
1. Read the problem statement → list entities (nouns) + roles + the ONE business rule.
2. Generate each entity: `npm run generate <Name> <field:type…>` → `npm run db:push` → restart dev.
3. Wire the ONE business rule server-side (Zod check + thrown `ApiError`), reflect in UI.
4. Point the dashboard stat cards + a chart at your main entity's `/stats`.
5. Seed a few believable rows; commit small + often; push at the end.

## ⚠️ Gotchas / notes
- **e2e must run against a prod build or a warm server.** `npm run test:e2e` auto-runs `build && start` when nothing is on :3000. If a *dev* server is already running it reuses it, and dev's lazy per-route compile can exceed the 5s assert timeout → false failures. So: run e2e with no dev server up, or don't worry about e2e mid-build.
- Admin login for testing: `owner@odoo.local` / `Owner@2026!` (hidden; see `prisma/seed.ts`). Real users self-register (role `user`).
- Fresh machine / wiped DB: `npm run db:setup` (create + seed) or `npm run db:reset` (wipe + seed).

## Day-of commands
```bash
cd web
npm run dev            # http://localhost:3000
npm run generate <Name> <fields…>   # scaffold a module
npm run db:push        # apply schema, then restart dev
npm run typecheck && npm run build  # health check before submitting
```
---
Fast start: read `web/CLAUDE.md` (state + reuse map) → this file → act. Don't re-explore or re-verify — it's all green.
