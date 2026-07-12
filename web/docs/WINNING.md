# How to Win (not just finish)

The kit already gets you a working app. Winners are separated by **judgment, story, and polish** — the things below. Pair this with [HACKATHON_RUNBOOK.md](HACKATHON_RUNBOOK.md) (event-day mechanics) and [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) (architecture talking points).

## The winning mindset
> Judges reward a **complete, believable product with a clear story** — not the most features. One entity done *end to end with real business rules* beats five half-wired CRUD tables.

## Typical Odoo judging axes → what to do
| Axis (weight varies) | How to win it with this kit |
|---|---|
| **Problem fit / relevance** | Restate the problem in your own words on the dashboard/README. Model the *exact* nouns from the statement as entities. |
| **Completeness of solution** | Every core flow works: create → list → edit → the one custom rule → see it reflected on the dashboard. No dead buttons. |
| **Technical depth** | Show the custom business logic (server-side rule, role gate, computed stat), not just generated CRUD. Point judges at it. |
| **UX / polish** | Real empty states, a clean login/landing, consistent copy, dark mode, no console errors. Kit gives most of this free — don't break it. |
| **Data model / architecture** | Link `SYSTEM_DESIGN.md` (ERD + flow render on GitHub). Be able to explain owner-scoping, Zod, cookie auth. |
| **Presentation / demo** | A 2–3 min video that tells a user story start to finish. This wins more points than another feature. |

## The 6-hour winning sequence (after the problem drops)
1. **~20 min — Decide the story.** One primary entity + 1–2 supporting. Write the one-sentence value prop. Pick the *one* business rule that makes it real (e.g. "a swap can't be accepted by its creator", "stock can't go negative", "only managers approve").
2. **~15 min — Generate the entities.** `npm run generate …` per entity → `npm run db:push`. You now have full CRUD + tables + forms + export + audit for free.
3. **~90 min — Wire the ONE rule.** This is the only truly custom code and the thing judges remember. Enforce it **server-side** (in the route handler with a Zod check + a thrown `ApiError`), then reflect it in the UI. Add role gating with `requireRole` where the problem implies roles.
4. **~45 min — Make the dashboard tell the story.** Point `StatCard`s + a `ChartCard` at your entity's `/stats`. This is the screen judges see first — it should scream "this solves the problem."
5. **~45 min — Seed believable demo data.** Edit `prisma/seed.ts` so the app looks *alive* on first load (realistic names, a few of each status). Empty apps look unfinished. `npm run db:reset`.
6. **~45 min — Polish + demo pass.** Fix copy, check dark mode, remove console errors, one clean landing/login. Walk your own demo once out loud.
7. **Throughout — commit small and often** with real messages (it's judged). Push to a **public** repo.

## Non-negotiables (auto-losers if missed)
- [ ] App **runs from a clean clone** — `npm i && npm run db:setup && npm run dev`. Test this on nothing but your notes.
- [ ] `npm run typecheck` and `npm run build` both pass at submission time.
- [ ] No dead buttons, no lorem ipsum, no console errors during the demo.
- [ ] Public GitHub link + short demo video in the submission.
- [ ] You can **explain every file** — judges may ask. See the "Explaining your code" section in the runbook.

## Force multipliers (do if time remains, in this order)
1. **Roles demo** — log in as admin vs user and show the difference. Cheap, very convincing.
2. **A second view of the same data** — `Kanban` or `Calendar` or `Timeline` on your main entity. High visual impact, near-zero cost (already built).
3. **Global search (⌘K)** wired to your entity via `config/nav.ts` — feels like a real product.
4. **CSV/PDF export** shown live — already in `DataTable`, just click it in the demo.
5. **Notifications** on the key action (`notify(...)`) so the bell lights up during the demo.

## Demo-video script (2–3 min, this wins points)
1. 10s: the problem, one sentence. 2. 20s: land on the dashboard — "here's the state of the world." 3. 60s: do the core user flow, **trigger the business rule** (show it blocking the bad case). 4. 30s: show a second view (Kanban/export/roles). 5. 20s: one line on the stack + architecture. Record in one take; don't narrate the code.

## Traps that sink good projects
- Building **breadth over depth** — five empty CRUD screens read as unfinished; one deep flow reads as a product.
- **Rebuilding plumbing** the kit already has (the token/time sink — see CLAUDE.md).
- Leaving the app **empty** at demo time (seed it).
- Saving all commits for a **single final dump** (looks like AI copy-paste; judges notice).
- Not being able to **explain your own code**.
