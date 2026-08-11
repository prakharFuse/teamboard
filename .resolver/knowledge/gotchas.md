---
name: gotchas
description: Non-obvious behaviors in the members API and seed data verified against the code
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
---

## Seed data has inconsistent department names

`server/src/db.ts:37-44` seeds "David Kim" and "Hiro Tanaka" with department `'Eng'`, while
"Alice Chen" uses `'Engineering'`. `GET /api/members/stats` groups `COUNT(*) ... GROUP BY
department` (`server/src/routes/members.ts:65-67`), so these show up as two separate departments
in stats and in the client's department-stats sidebar, not one merged "Engineering" bucket. Any
department-validation work (see [[overview]] — TM-105) needs an explicit allow-list rather than
inferring valid values from existing rows, or it will canonicalize on the wrong spelling.

## `is_active` exists but nothing ever sets it to 0 — DELETE is a hard delete

The `members` table has an `is_active` column (`server/src/db.ts:26`) and `GET /api/members`
filters on `is_active = 1` (`server/src/routes/members.ts:21`), which reads like a soft-delete
design. In practice `DELETE /api/members/:id` issues `DELETE FROM members WHERE id = ?`
(`server/src/routes/members.ts:115`) — a real row deletion — and no route ever writes
`is_active = 0`. `PATCH` also can't touch it: it only updates `name`, `email`, `role`,
`department` (`server/src/routes/members.ts:92-101`). Treat `is_active` as currently
vestigial/unused rather than a working soft-delete flag; if a task asks for "soft delete" or
"deactivate member" semantics, that's new behavior to add, not a bug to fix in existing code.

## `PATCH /api/members/:id` silently ignores `start_date`

Only `name`, `email`, `role`, `department` are updatable via PATCH
(`server/src/routes/members.ts:92-101`); a `start_date` field in the request body is accepted but
never read or written. CLAUDE.md's endpoint table just says "update member fields" without
listing which ones, so this isn't a doc contradiction — just worth knowing before assuming PATCH
is a full field update.
