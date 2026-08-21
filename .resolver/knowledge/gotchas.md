---
name: gotchas
description: Non-obvious behaviors in the members API not covered by CLAUDE.md/README
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## `department` has zero validation today (TM-105)

`POST /api/members` (server/src/routes/members.ts:26-46) inserts whatever `department` string the caller sends — no enum, no lookup table, no format check. `server/src/routes/members.test.ts` has a test asserting this must 400 on an invalid department; it is red on `main` on purpose (see [[overview]]). There is no existing list of "valid" departments anywhere in the code to validate against — seed data alone uses at least two spellings for the same department (`Engineering` / `Eng`, see [[data-model]]), so implementing TM-105 requires first deciding/defining the canonical department set.

## `PATCH /:id` silently ignores `start_date` and `is_active`

The route destructures only `{ name, email, role, department }` from the body (server/src/routes/members.ts:92) — sending `start_date` or `is_active` in a PATCH is a no-op, not an error. CLAUDE.md's "update member fields" description doesn't call out this restriction.

## `GET /api/members` vs `/export` active-only filtering differs

`GET /api/members` filters `WHERE is_active = 1` (server/src/routes/members.ts:21), but `GET /api/members/export` returns **all** rows regardless of `is_active` (server/src/routes/members.ts:50). This is deliberate for the CSV/HR export use case, but means the two endpoints are not a subset/superset of the same query — don't assume export row count matches the UI's active-member count.

## Tests require `TEAMBOARD_DB_PATH=':memory:'` set before first `getDb()` call

`getDb()` in server/src/db.ts caches its `DatabaseSync` instance in a module-level variable on first call. Tests set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at import time (server/src/routes/members.test.ts:24), before any request touches the router — setting it later has no effect since the real file-backed DB would already be open.
