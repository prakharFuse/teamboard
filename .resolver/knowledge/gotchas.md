---
name: gotchas
description: Code-verified sharp edges in TeamBoard — read before touching validation, CSV export, or seed data
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
---

**Department validation doesn't exist yet, and CI expects it (TM-105).**
`POST /api/members` (`members.ts:26-46`) inserts whatever `department` string the
caller sends — no allowlist, no enum. `members.test.ts` has an intentionally-red
test, `"POST /api/members rejects an invalid department with 400"`, that CI runs on
every PR (`.github/workflows/ci.yml`). It stays red until department validation is
added. Whoever implements it should check the seed data first (see next item) —
a naive allowlist will break the existing "Eng" rows.

**Seed data uses inconsistent department names.** `db.ts:37-44` seeds "Engineering"
(Alice Chen), "Product", "Design", "Eng" (David Kim, Hiro Tanaka — not
"Engineering"), "Marketing", "Sales", "Human Resources". If TM-105 validation
introduces a fixed allowed-department list, it must include both "Engineering" and
"Eng" (or the seed data needs to be normalized in the same change) or the
seeded/dev DB ends up with rows that couldn't be created through the validated API.

**CSV export does not escape fields.** `GET /api/members/export` (`members.ts:48-58`)
joins raw column values with commas and newlines into a CSV string with no
quoting/escaping. A `name` or `role` containing a comma, quote, or newline will
corrupt the CSV structure (classic CSV-injection-adjacent bug, not a SQL
injection — the query itself is parameterized).

**`PATCH /api/members/:id` can't touch `start_date` or `is_active`.** Only `name`,
`email`, `role`, `department` are read from `req.body` (`members.ts:92`); sending
`start_date` in a PATCH is silently ignored rather than rejected.

**`DELETE` is a hard delete despite the `is_active` soft-delete column** — see
[[data-model]] for detail.

**Tests must set `TEAMBOARD_DB_PATH=':memory:'` before the first `getDb()` call.**
`getDb()` reads the env var lazily on first invocation and then caches the
`DatabaseSync` handle for the life of the process (`db.ts:7-16`) — setting the env
var after any handler has already run has no effect. See [[testing]].
