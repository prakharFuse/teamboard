---
name: gotchas
description: Non-obvious runtime behaviors — hard delete vs the is_active column, CSV export escaping, missing department validation
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/src/routes/members.test.ts
---

## `DELETE` hard-deletes rows; `is_active` is otherwise dead

The schema has `is_active INTEGER NOT NULL DEFAULT 1` (`server/src/db.ts:26`), and `GET /api/members` + `GET /api/members/stats` both filter `WHERE is_active = 1`. But `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) does `DELETE FROM members WHERE id = ?` — a real row delete, not `UPDATE ... SET is_active = 0`. Nothing in the codebase ever sets `is_active` to 0. Net effect: every row that exists always has `is_active = 1`, so the filter is currently a no-op, and `GET /api/members/export` (which intentionally omits the `is_active` filter, `server/src/routes/members.ts:48-58`, presumably to include former members for HR) in practice exports the exact same rows as the active-members list. If a "soft delete / restore" feature is ever wanted, it needs a new code path — the column alone doesn't provide it.

## CSV export doesn't escape fields

`server/src/routes/members.ts:52-54` builds CSV rows with plain template-literal interpolation and no quoting/escaping. A `name` or `role` containing a comma, quote, or newline (which `POST` happily accepts — see below) will produce a malformed CSV row. There's no test covering this.

## `POST /api/members` accepts any `department` string — TM-105 is open

There is a checked-in failing test for this: `server/src/routes/members.test.ts:70-85`, "rejects an invalid department with 400", documented in that file's header comment as intentionally RED on `main` until ticket TM-105 (department validation) lands. The endpoint (`server/src/routes/members.ts:26-31`) only checks the five required fields are truthy — it never validates `department` against a known set, so any string is accepted and inserted. See [[data-model]] for why the seed data itself ("Eng" vs "Engineering") makes picking a canonical list non-trivial.
