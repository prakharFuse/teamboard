---
name: gotchas
description: Non-obvious runtime traps in TeamBoard's server — DB singleton timing, hard-delete, unescaped CSV
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
---

## `TEAMBOARD_DB_PATH` only matters before the first `getDb()` call

`getDb()` (`server/src/db.ts:11-48`) memoizes the `DatabaseSync` instance in a module-level `let db`. Setting `process.env.TEAMBOARD_DB_PATH` after any handler has already run does nothing — the path is read once, on first construction. `members.test.ts:24` sets it to `:memory:` at module load time, before the router is even imported, which is why it works there. If you add a second test file that imports `members.js` without setting the env var first, it'll fall through to the real `data/team.db` default.

## `DELETE /api/members/:id` is a hard delete despite the `is_active` column

See [[data-model]] — `is_active` is filtered on read but never written to `0` anywhere. Don't build a "restore deleted member" feature assuming soft-delete semantics; the row is actually gone.

## CSV export does not escape fields

`GET /api/members/export` (`members.ts:48-58`) builds each row with a template string join — `${r.id},${r.name},${r.email},...` — with no quoting or comma/quote escaping. A member `name` or `role` containing a comma will silently shift columns in the downstream CSV (the "HR integration" the README mentions). This is separate from the SQL-parameterization rule in [CLAUDE.md](../../CLAUDE.md) — that rule is about the `db.prepare(...)` calls, which are all correctly parameterized; the CSV string-building is a different, unaddressed gap.

## `PATCH /api/members/:id` silently ignores unknown fields

Only `name`, `email`, `role`, `department` are read out of `req.body` (`members.ts:92`); `start_date` and `is_active` can't be updated via PATCH even though the client never tries to. If a PATCH request includes a typo'd field name, it's dropped with no error.
