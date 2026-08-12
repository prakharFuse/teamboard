---
name: gotchas
description: Non-obvious behaviors verified in code — route ordering, hard delete vs the is_active flag, and inconsistent seed department names
type: knowledge
scope: global
updated: 2026-08-12 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
---

## Route order in members.ts is load-bearing

`/export` and `/stats` are registered before `/:id` (`server/src/routes/members.ts:48,60,71`). Express matches routes in registration order, so if a new route were inserted between `/:id` (line 71) and the router's export, or if `/export`/`/stats` were moved after `/:id`, requests to `GET /api/members/export` would instead hit the `/:id` handler with `id = "export"` — `Number("export")` is `NaN`, and the `WHERE id = ?` lookup would just miss and 404. Any new static-path route (e.g. a future `/api/members/search`) must be added above `/:id`, not below.

## DELETE is a hard delete despite the is_active column

`is_active` looks like it exists to support soft deletes, and `GET /api/members` / `GET /api/members/stats` do filter on `is_active = 1`. But `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) runs `DELETE FROM members WHERE id = ?` — an actual row delete, not `UPDATE members SET is_active = 0`. Nothing in the codebase ever sets `is_active` to `0`; it's write-once at insert time. If a task asks for "soft delete" or "restore a removed member," that's new behavior, not a bug fix — the current DELETE endpoint permanently removes the row (and `GET /api/members/export`, which has no `is_active` filter, would also stop including it, since the row no longer exists).

## Seed data has inconsistent department names for the same team

`server/src/db.ts:37-44` seeds two members under `'Engineering'` (Alice) and two under `'Eng'` (David, Hiro) — apparently the same team, spelled two ways. Because `department` is unvalidated free text (see [[data-model]]), `GET /api/members/stats` groups them as separate departments. This is the concrete symptom of the missing validation that `server/src/routes/members.test.ts`'s intentionally-red test (TM-105, see [[overview]]) is asking to be fixed — a real department allowlist/enum would also need to reconcile or migrate this existing seed data, not just reject new bad input.
