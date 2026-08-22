---
name: gotchas
description: Sharp edges in member CRUD, CSV export, and the singleton DB that aren't documented elsewhere
type: knowledge
scope: global
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/src/routes/members.test.ts
---

## DELETE hard-deletes despite the `is_active` column

`DELETE /api/members/:id` runs `DELETE FROM members WHERE id = ?`
(`server/src/routes/members.ts:115`) — a real row deletion, not a soft
delete. The `is_active` column (`server/src/db.ts:26`) is set at insert time
and read by `GET /` and `/stats`, but nothing in the codebase ever flips it
to 0. If a future change needs "remove from directory but keep for HR
history", the current DELETE route is the wrong place to hook it — it would
need to become an `UPDATE ... SET is_active = 0` instead, and every route
that filters on `is_active = 1` should already do the right thing.

## Department is unvalidated by design (TM-105)

`POST /api/members` accepts any non-empty `department` string
(`server/src/routes/members.ts:26-31`) — there is no allow-list check.
`server/src/routes/members.test.ts:70-85` has an intentionally **RED** test
("rejects an invalid department with 400") documented in its own file header
as the expected failing check for ticket TM-105. Don't "fix" this by
loosening the test — the ticket is asking for real server-side department
validation to be added to the route.

## CSV export doesn't escape fields

`GET /api/members/export` builds CSV by raw template-string interpolation
(`server/src/routes/members.ts:52-54`) with no quoting or escaping. A `name`
or `department` containing a comma, quote, or newline will corrupt the CSV
(and a field starting with `=`, `+`, `-`, or `@` is a classic CSV-injection
vector when opened in Excel). There's no existing test covering this.

## PATCH silently drops `start_date`

`PATCH /api/members/:id` only reads `name, email, role, department` from the
body (`server/src/routes/members.ts:92`) — `start_date` is accepted by
neither the destructure nor the `UPDATE` statement, so sending it is a no-op.
CLAUDE.md and README both describe PATCH generically as "update member
fields," which isn't wrong, but don't assume `start_date` is patchable
without extending the route first.

## `getDb()` is a lazy singleton — env var must be set before first call

`server/src/db.ts:9-16` caches the `DatabaseSync` instance in a module-level
`let db`. `TEAMBOARD_DB_PATH` only has an effect the *first* time `getDb()`
runs in a process; `server/src/routes/members.test.ts:24` relies on this by
setting the env var at module load, before any request handler fires. If you
add a new entrypoint or test file that imports `db.ts` indirectly before
setting this env var, it will silently open `data/team.db` instead of an
in-memory DB.
