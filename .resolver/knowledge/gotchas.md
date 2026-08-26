---
name: gotchas
description: Non-obvious behaviors in the members API and DB layer — check before changing delete/validation/export logic
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **`DELETE /api/members/:id` hard-deletes the row** (`server/src/routes/members.ts:106-117`,
  `DELETE FROM members WHERE id = ?`) — it does not set `is_active = 0`.
  `is_active` exists in the schema and `GET /` filters on it, but nothing in
  the codebase ever flips it to `0`; every seeded/inserted row is active
  forever unless a row is actually deleted. Don't assume "remove" is a soft
  delete when working on this endpoint or on `is_active`-related logic.

- **Department/role validation does not exist yet, and that's intentional
  right now.** `POST /api/members` and `PATCH /api/members/:id` accept any
  `department`/`role` string with no allow-list or `CHECK` constraint. The
  test `POST /api/members rejects an invalid department with 400`
  (`server/src/routes/members.test.ts:70-85`) is a deliberately RED
  contract test tracked as TM-105, wired into CI so a fix produces a real
  passing check. If asked to add department validation, the fix belongs in
  `members.ts` (reject unknown departments before the `INSERT`/`UPDATE`) —
  making only the test pass without adding real validation logic would be
  wrong, and touching the test to weaken/remove this assertion is very
  likely wrong too, since it is a tracked, intentional CI signal.

- **CSV export does not escape fields**
  (`server/src/routes/members.ts:48-58`): rows are joined with a plain
  template string, so a `name` or `role` containing a comma, quote, or
  newline will corrupt the CSV's column alignment for the HR download. No
  quoting/escaping helper currently exists in the codebase.

- **`TEAMBOARD_DB_PATH` is read once, at module load** (`server/src/db.ts:7`),
  and the singleton `db` (`server/src/db.ts:9`) is created lazily on first
  `getDb()` call. Tests set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at
  the top of `members.test.ts` before any request is made — any new test
  file that imports `db.ts` (directly or via a router) must do the same
  before the first `getDb()` call, or it will touch the real `data/team.db`
  file.
