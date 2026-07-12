# CLAUDE.md — AI Working Agreement (Production Stack)

> Single source of truth for any AI assistant working in `web/`. Read once, then build. **Don't re-read files you already saw; don't re-explore what's mapped below.**

## Current state — pre-flight VERIFIED 2026-07-12 (trust this; don't re-verify)
- **New session? Read `web/PROGRESS.md` first** (the live baton: what's done / next / gotchas), then act. **Update it before you stop.** This is how 3 sessions stay continuous.
- ✅ Local Postgres 18 running + seeded (admin + demo items) · `typecheck` clean · `build` passes. **Setup is DONE — don't redo it.**
- **After the problem drops, only two things are custom:** (1) the entities → `npm run generate <Name> <fields…>` then `npm run db:push`; (2) the ONE business rule (server-side Zod check + thrown `ApiError`, then reflect in UI). Everything else already exists — see the reuse map.
- **DB is already strong:** the generator emits money as `Decimal(12,2)` (no float drift) and auto-indexes owner(+status) + every `ref`/FK column. **Don't hand-fix money handling or add indexes** — it's built in and matches the `Item` model.
- Optional multi-tenant org/team mode: `docs/ORG_MODE.md` (build only if the problem is about teams).

## Token discipline (read first — this is a hackathon)
Context = time = money. Every rule here exists to stop wasted turns.
- **Trust this file** as the map of the repo. Don't `ls`/`grep`/open files to "learn the codebase" — the reuse map + folder map below are authoritative. Open a file only to *edit* it or when a build error names it.
- **A new module is `npm run generate`, not hand-written code.** If you're about to write a fetch layer, table, form, pagination, auth, or toast — stop, it exists. Reinventing plumbing is the #1 token sink.
- **Don't paste large files or command output back to the user.** Summarize in ≤3 lines. Never echo a whole file you just wrote.
- **Batch independent tool calls** in one turn. Don't verify a write by re-reading it — the editor errors if it failed.
- **One verification at the end**, not after every step: `npm run typecheck` (fast) before `npm run build` (slow). Skip `build` until typecheck is clean.
- Prefer **editing over rewriting**; prefer the **generator over editing**.

## What this is
A production-grade, reusable ERP/business-app starter. One **Next.js 15 full-stack app** (UI + API routes), fully typed end to end. After a problem statement drops, you add **entities**, not plumbing.

## Stack (don't swap)
TypeScript (strict) · Next.js 15 App Router · PostgreSQL + Prisma · Zod (shared validation) · TanStack Query (server state) · httpOnly-cookie auth (jose + bcrypt) · Tailwind (semantic tokens, dark mode) · recharts · Sentry · Vitest + Playwright.

## Design language (already built — match it, don't redesign)
"**Wolf slate + blue**": confident **blue** brand, warm-ivory canvas + white cards in light / cohesive slate in dark, and a **fixed dark slate sidebar** in both themes. Cards are `rounded-2xl` and border-led (flat, not heavy shadows); headings `font-bold tracking-tight`; inputs/buttons `rounded-lg`; one accent carries the emphasis. **Reskin the entire app by editing the `brand` color scale in `tailwind.config.ts` — one place.** Never hand-pick hex in components; semantic tokens only. Use `Avatar` (people), `FilterTabs` (browse/status filters), `SectionLabel` (group headers) — don't rebuild them.

## Golden path — generate, don't build
```bash
npm run generate Order customer total:currency status:enum:draft,paid,shipped due:date
npm run db:push        # apply schema + regenerate client, then restart dev
```
→ Prisma model + Zod schema + typed API routes + typed CRUD page (search/sort/filter/paginate + CSV·Excel·PDF export + dark mode + toasts + audit log) + sidebar entry. Visit `/orders`.
Field types: `string`(default) · `text` · `number` · `currency` · `boolean` · `date` · `enum:a,b,c` · `ref`. First string field = label/search; enums become filters. Re-run with `--force` to overwrite.

## Folder map
```
src/
  app/(auth)/login,register            public
  app/(app)/dashboard,items,activity   protected shell (middleware gates)
  app/api/**/route.ts                  the backend (Route Handlers)
  lib/     prisma · auth · env · validation(zod) · crud · api-error · api-client · notify · activity · export · format · cn · rate-limit · password · serialize · schemas/*
  hooks/   useResource (TanStack Query) · useDebounce
  providers/ Theme · Query · Toast · Auth · Confirm
  components/ui/  kit · DataTable · EntityForm · CrudPage · Chart · StatCard · Modal · Timeline · Kanban · Calendar
  components/layout/ GlobalSearch · NotificationBell
  config/nav.ts   sidebar + search sources (generator inserts here)
  middleware.ts   edge auth gate for pages
prisma/  schema.prisma · seed.ts        tests/  unit (vitest) · e2e (playwright)
```

## Reuse map — use these, never rebuild
| Need | Use |
|---|---|
| Full list+create+edit+delete page | `CrudPage<T>` |
| Data fetching (list/search/sort/filter/paginate + mutations) | `useResource<T>('/path')` |
| Table (sort/filter/export CSV·Excel·PDF·print) | `DataTable` |
| Form (typed, validated) | `EntityForm` |
| API for a model | copy `src/app/api/items/` (or generate) |
| List query helper (where/orderBy/skip/take) | `buildListArgs` + `paginated` |
| Auth guards (server) | `requireUser()`, `requireRole(user, …)` |
| Audit entry / Notification | `logActivity({…})` / `notify(userId,{…})` |
| Charts | `ChartCard` + `BarChartX`/`PieChartX` |
| Board / feed / calendar | `Kanban` / `Timeline` / `Calendar` |
| Avatar (initials) · browse filter pills · group label | `Avatar` · `FilterTabs` · `SectionLabel` |
| Money/date/relative time | `formatCurrency`/`formatDate`/`timeAgo` |

## Conventions
- **Names:** models PascalCase singular (`Order`); routes/paths plural lowercase (`/api/orders`).
- **Styling:** semantic tokens only — `bg-surface`, `bg-canvas`, `text-fg`, `text-fg-muted`, `border-border`, `brand`. Never `bg-white`/`text-gray-*` (breaks dark mode). Combine with `cn()`.
- **Client data:** always via `@/lib/api-client` (`api.get/post/patch/del`) — cookies ride along; throws `ApiError`.
- **Server:** validate input with a Zod schema; wrap handlers in `route()`; throw `ApiError.notFound()` etc.; scope per-user data by `createdById`.
- **Never** read the session token in client JS — it's httpOnly by design.

## Recipes (don't load unless the problem calls for it)
- **Multi-tenant org/team mode** (users share a workspace; isolation flips `createdById`→`orgId`): `docs/ORG_MODE.md`. Ported from the wolf ERP `Organization` feature. Build only if the problem is about teams/companies — otherwise per-user scoping + role RBAC already suffice.

## Definition of done
1. Reuses the kit (no reinvented table/form/fetch/auth). 2. `npm run typecheck` clean, `npm run build` passes. 3. Works light + dark. 4. Loading/empty/error states handled (free via `DataTable`/`CrudPage`). 5. New server logic has a Zod schema + owner scoping where relevant.
