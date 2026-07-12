# Hackathon Runbook (solo)

Everything you need on event day, in order. The plumbing is already built and
verified — you focus on the problem statement.

## Pre-flight — verified 2026-07-12 ✅ (green, don't re-run unless something changed)
- Local **PostgreSQL 18** service *Running* (offline, no cloud); `web/.env` → `localhost:5432/odoo_web`.
- DB set up + seeded (admin user + demo items present). `npm run typecheck` clean · `npm run build` passes (exit 0).
- All auth pages + API routes present (login/register/forgot-password/reset-password, items CRUD+stats, activity, notifications, health).

## The night before
- [ ] Confirm **local PostgreSQL 18** is running (`Get-Service postgresql-x64-18` → *Running*). No cloud, works offline.
- [ ] `cd web && npm run dev` → open http://localhost:3000, log in once. (Fresh machine? `npm run db:setup` first.)
- [ ] Re-read your own code once so you can explain it (auth flow, Zod, the generator).
- [ ] Confirm your edition's rulebook: "any tech stack allowed?" (yes for Odoo) + submission format.

## Run it (fully local — no internet needed)
The database lives on this laptop (Postgres on `localhost:5432`, DB `odoo_web`).
`web/.env` already points at it. Just:
```bash
cd web
npm run dev            # http://localhost:3000
```
Fresh machine / reset? One command each:
```bash
npm run db:setup       # create tables + seed
npm run db:reset       # wipe + recreate + seed (clean slate)
```
Then open the app and **Register** to create your account (role `user`). Hidden test admin: see `prisma/seed.ts`.

## When the problem statement drops
1. **Read it. List the entities** (nouns) and their fields, and the user roles.
2. **Generate each entity** — one command each:
   ```bash
   npm run generate SwapRequest fromSkill toSkill status:enum:pending,accepted,rejected note:text
   npm run db:push
   ```
   You instantly get: model + validated API + typed CRUD page + search/sort/filter +
   pagination + CSV/Excel/PDF export + dark mode + toasts + audit log + sidebar link.
3. **Wire the business rules** — the only custom part (e.g. "can't accept your own request").
4. **Roles/admin** — gate admin actions with `requireRole(user, 'admin')` (server) and the role check (UI).
5. **Dashboard** — point the stat cards + charts at your main entity's `/stats`.
6. **Polish** — empty states, a clean landing/login, consistent copy. (Most is already done.)

## Commit as you go (it's judged)
Make **small, frequent commits** with real messages — not one giant dump at the end:
```bash
git add -A && git commit -m "feat: swap-request module + accept/reject rules"
```
Push to a **public GitHub repo** and put the link in your submission.

## Submission checklist (from the Odoo template)
- [ ] Team/member details (solo is fine)
- [ ] Problem statement chosen
- [ ] Solution overview
- [ ] **Frameworks/tech used** — Next.js · TypeScript · PostgreSQL · Prisma · Zod · TanStack Query · Tailwind
- [ ] **UI/UX mockup** (make a quick one in Figma/Excalidraw if required)
- [ ] Business scope & use case
- [ ] **System design / architecture** → link `docs/SYSTEM_DESIGN.md` (ERD + flow already done)
- [ ] Coding approach
- [ ] GitHub repo link + a short demo video

## Explaining your code (no blind AI copy-paste)
Be ready to walk through:
- **Auth:** login verifies bcrypt hash → jose signs a JWT → stored in an httpOnly cookie →
  middleware verifies it at the edge → `requireUser()` guards each API route.
- **A request:** page → `useResource` (TanStack Query) → `/api/...` → Zod validates →
  Prisma query scoped by `createdById` → audit log → JSON back.
- **Why Postgres/Prisma, cookie-auth, Zod** — see the "Design decisions" in SYSTEM_DESIGN.md.

## Quick health checks
```bash
npm run typecheck   # types clean
npm run test        # unit tests
npm run build       # production build
```
