# Org / Team Mode — reference recipe (only build if the problem needs it)

Multi-tenant **workspaces**: users belong to an *organization*, and data is isolated
per-org instead of per-user. Ported from the wolf ERP `Organization` feature to this
Prisma/Next stack. **Don't pre-build this** — it touches auth + every query. Do it
only if the problem statement is about *teams / companies / shared workspaces*.

> The kit already isolates data **per user** (`ownerField: 'createdById'`) and has
> role RBAC (`admin`/`manager`/`user`). If you just need "admins see everything,"
> use roles — you don't need org mode. Org mode = **many users share one dataset**.

The isolation boundary simply **flips from `createdById` → `orgId`**. Three levels,
stop at whichever the problem needs.

---

## Level 1 — one shared workspace (~5 min)
Everyone in the org sees the same data. Good when the whole demo is "one company."

1. **Schema** — add an `Organization` and an `orgId` on `User` + each shared entity:
   ```prisma
   model Organization {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
     users     User[]
     items     Item[]
   }
   // on User:  orgId String?   ; org Organization? @relation(fields:[orgId],references:[id])
   // on Item:  orgId String?   ; org Organization? @relation(fields:[orgId],references:[id])
   //           and change @@index([createdById, status]) → @@index([orgId, status])
   ```
   `npm run db:push` then `npm run db:reset` (dev data has no org yet).

2. **Seed** one org and stamp the seeded rows with its `id` (edit `prisma/seed.ts`).

3. **Scope lists by org** — in each route's `LIST` config
   (`src/app/api/items/route.ts` and any generated module) swap the owner field and
   pass the org value:
   ```ts
   const LIST = { searchFields:['name','sku'], filterFields:['status'], ownerField: 'orgId' };
   const args = buildListArgs(query, LIST, user.orgId);      // was user.id
   ```
   On **create**, stamp `orgId: user.orgId` instead of (or alongside) `createdById`.
   → Requires `orgId` on the session — see Level 2.

## Level 2 — real multi-org signup (~10 min)
Each new account gets its own workspace; two accounts never see each other's data.

1. **Register** (`src/app/api/auth/register/route.ts`) — create an org, then the user
   in it, in one `prisma.$transaction`:
   ```ts
   const org = await tx.organization.create({ data: { name: `${name}'s Workspace` } });
   const user = await tx.user.create({ data: { ...rest, orgId: org.id } });
   ```

2. **Put `orgId` in the session** so routes/middleware can scope without a DB hit —
   edit `src/lib/auth.ts` in three spots:
   - `SessionUser` type → add `orgId: string`.
   - `createSession` → add `.orgId` to the signed payload.
   - `verifyToken` → read `orgId: String(payload.orgId ?? '')` back out.
   Existing sessions must re-login once (payload shape changed).

3. Every list/create now scopes by `user.orgId` (Level 1, step 3). Done — full tenant isolation.

## Level 3 — per-member roles & permissions (optional, ~20 min)
Only if the problem needs granular "who can do what" inside an org (invite, approve,
manage settings…). Mirror the wolf ERP `Membership` shape:

- **Membership** model: `{ orgId, userId, role: owner|admin|member, permissions Json }`
  — a JSON map of capability booleans (`canInvite`, `canApprove`, …). Store a
  **complete, known-key** map so an invite can't inherit a half-defined set.
- **Guard**: `requireOrgPermission(user, 'canApprove')` in the route handler
  (throws `ApiError.forbidden()`), and gate the matching UI button on the same key.
- **`/organization` page**: name + settings + member list; owner edits member
  permissions. Generate the members view with `CrudPage`, hand-wire the toggle grid.

For most hackathons **Level 1–2 is plenty** — it's the isolation that reads as
"a real multi-tenant product." Level 3 is a force-multiplier only if the story is
explicitly about team collaboration.

---
### Gotchas
- **Migrate existing rows**: any row created before `orgId` existed has `orgId = null`
  and would leak across tenants (null matches null). Backfill in seed/migration, or
  make `orgId` required after backfilling.
- **Don't scope by both** `createdById` *and* `orgId` unless you mean "my rows within
  my org" — pick the boundary the problem describes.
- **Session staleness**: `orgId` lives in the JWT for a request-free scope check; if a
  user can switch orgs, re-issue the cookie (`createSession`) on switch.
