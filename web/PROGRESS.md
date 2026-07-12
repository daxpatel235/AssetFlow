# PROGRESS — live session baton

> The handoff between Claude sessions. **Every new session: read this first.**
> **Before you stop / switch sessions: update the sections below.** Keep it short.
> This also doubles as a build journal for judges.

## ✅ AssetFlow is fully DB-backed & persistent — verified 2026-07-12
The app was migrated from a client-only mock prototype to a **real Postgres-backed
full-stack app**. Every screen now renders live database rows; every workflow
persists across reloads; RBAC is enforced on the server.

**Architecture (DB-backed store):**
- **`GET /api/bootstrap`** — one authenticated aggregate read; returns all 11 collections
  (departments, categories, employees, assets, allocations, transfers, bookings,
  maintenance, auditCycles, notifications, activity) in the exact client shapes.
  `Cache-Control: no-store` so it always reflects the latest write.
- **`POST /api/actions`** — the single mutation entrypoint. Body `{action, payload}`.
  All lifecycle logic lives in **`src/lib/server/assetflow-service.ts`**: Zod-validated,
  **RBAC by session role** (`permissionsFor`, never client-supplied), **transactional**
  (`$transaction`) so multi-row invariants can't half-apply. Records activity + fans out
  per-user notifications.
- **`src/lib/store/assetflow-store.tsx`** (`useAF()`) — loads bootstrap once, hydrates the
  arrays in `src/lib/mock/assetflow.ts` **in place** (so no page code changed), then each
  action POSTs to `/api/actions` and refetches bootstrap → "change anywhere reflects
  everywhere, and survives reload." Role/permissions come from the **auth session** only.
- Removed the self-assign `IdentitySwitcher` (security). My Workspace keeps a local,
  read-only "view as" lens that can't change server-enforced permissions.

**Actions implemented (all persistent + RBAC-gated):** registerAsset, allocate,
returnAllocation, requestTransfer, decideTransfer, createBooking, cancelBooking,
raiseMaintenance, decideMaintenance, assignTechnician, startMaintenance,
resolveMaintenance, setAuditResult, closeAudit, createAuditCycle, add/update/toggle
Department, add/update Category, addEmployee, setEmployeeRole, toggleEmployeeStatus,
markAllRead, markRead.

**Proven end-to-end (curl against prod build):** login persists session; bootstrap returns
correct shapes/counts; registerAsset persists (24→25); employee→registerAsset & self-promote
→ **403**; approve maintenance → asset flips `available`→`maintenance` (transactional cascade);
notifications are per-user scoped; booking create/conflict(409)/non-bookable(400)/cancel all
persist. **typecheck clean · prod build passes.**

**Seed = rich demo data in every corner** (`npm run db:seed`): 6 depts, 5 categories,
12 users, 24 assets, 10 allocations, 145 bookings (spread across **every** persona),
6 maintenance (all statuses), 3 audit cycles, 4 transfers, **20 notifications fanned across
8 personas**, 18 activity entries. The primary admin persona has its own credentials
(below); the other 11 users share password `Owner@2026!`.

## 🔑 Demo logins
| Role | Email | Password | Shows off |
|---|---|---|---|
| **Admin (you)** | `pateldax23056@gmail.com` | `Dax...2323` | Everything: org setup, approvals, reports, activity |
| Asset Manager | `marcus.reyes@assetflow.io` | `Owner@2026!` | Register/allocate, approve transfers & maintenance, audits |
| Dept Head | `daniel.okafor@assetflow.io` | `Owner@2026!` | Dept view, approvals, bookings |
| Employee | `priya.nair@assetflow.io` | `Owner@2026!` | My Workspace (held assets, overdue, bookings, transfers), raise maintenance |
| Technician | `lena.fischer@assetflow.io` | `Owner@2026!` | Assigned repairs (start/resolve) |

## 🎤 Demo punchline
Do a workflow (approve a maintenance request → asset goes Under Maintenance everywhere),
then **reload the page — it stays.** Log out, log in as an employee — the sidebar collapses
to their access and the server rejects any privileged action (real RBAC, not hidden buttons).

## ⚠️ Gotchas / notes
- **Never run `next dev` and a prod `next start` against the same `.next`.** A stale turbo
  dev server can corrupt `.next` → `Cannot find module '[turbopack]_runtime.js'`. Fix:
  kill it, `rm -rf .next`, `npm run build`, `npm start`.
- Fresh machine / wiped DB: `npm run db:setup` (create + seed) or `npm run db:reset` (wipe + seed).
- `DATABASE_URL` + `JWT_SECRET` live in `web/.env`. Local Postgres 18 service: `postgresql-x64-18`.

## Day-of commands
```bash
cd web
npm run db:reset       # pristine demo data
npm run dev            # http://localhost:3000
npm run typecheck && npm run build  # health check before submitting
```
---
Fast start: read `web/CLAUDE.md` (state + reuse map) → this file → act. It's all green.
