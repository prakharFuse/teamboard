---
name: api-validation
description: Validation gaps in the members API — what's checked vs. not, per route
type: convention
scope:
  - server/src/routes/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

For error shape and the parameterized-SQL rule, see [CLAUDE.md](../../CLAUDE.md) — both hold in the current code.

Validation is inconsistent across routes in `members.ts` — worth knowing before assuming a route is "safe" by analogy with another:

- `POST /` checks all five fields are truthy (`members.ts:28`), but does not validate `email` format, `start_date` format, or that `department` is a known value (the known-red test in [[overview]] targets exactly this last gap).
- `PATCH /:id` (`members.ts:83-104`) validates nothing — any string value for `name`/`email`/`role`/`department` is accepted via `COALESCE`, including an empty string (falsy-but-present fields aren't rejected the way `POST` rejects them).
- `GET /:id`, `PATCH /:id`, `DELETE /:id` all do `Number(req.params.id)` with no `NaN` check — an invalid `:id` like `/api/members/abc` becomes `Number('abc')` → `NaN`, which SQLite's `?` binding treats as "no row matches," so these routes surface it as a normal 404 rather than a 400. That's a reasonable outcome, but it's coincidental (via SQLite's no-match behavior), not a validated `isNaN` guard.
