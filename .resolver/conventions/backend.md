---
name: backend
description: Server-side route and DB-access conventions not written down in CLAUDE.md — read before adding a route or table
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/src/index.ts
---

For error response shape and parameterized-SQL rules, see
[../../CLAUDE.md](../../CLAUDE.md#rules) — accurate, not restated here.

Beyond that, the codebase (one route file, `members.ts`) establishes these
patterns:
- **No service/repository layer.** Route handlers call `getDb()` directly and
  inline SQL with `db.prepare(...).run/get/all(...)`. There's no abstraction to
  route around — adding a second resource should follow the same shape (one router
  file per resource, mounted in `index.ts`) rather than introducing a new layer.
- **`getDb()` is a lazy, process-wide singleton** (`db.ts:9-16`) — it opens the DB
  and runs `CREATE TABLE IF NOT EXISTS` + seed-if-empty on first call only. Schema
  changes belong inside that same `db.exec(...)` block (there's no migration
  runner); guard any new seed logic the same way the existing seed is guarded
  (`count.count === 0`) so it doesn't re-insert on every request.
- **Existence checks precede mutation.** `PATCH` and `DELETE` both `SELECT ... WHERE
  id = ?` first and return 404 before touching the row (`members.ts:83-91,
  106-114`) rather than relying on the mutation's affected-row count. Match this
  when adding new mutating routes.
- **Route param IDs are `Number(req.params.id)`**, not parsed/validated further —
  a non-numeric id becomes `NaN`, which safely matches no row and falls into the
  existing 404 path rather than needing separate handling.
