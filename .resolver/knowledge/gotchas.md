---
name: gotchas
description: Known sharp edges and an intentionally-failing test in TeamBoard — read before touching members.ts
type: knowledge
scope: global
updated: 2026-08-05 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
---

## TM-105: department validation is missing, and CI knows it

`server/src/routes/members.test.ts` has a test, `POST /api/members rejects an
invalid department with 400`, that is **intentionally RED on `main`** — the
comment block at the top of the file and the CI workflow comment
(`.github/workflows/ci.yml:3-7`) both say so explicitly. `POST /api/members`
(`server/src/routes/members.ts:26-46`) inserts whatever `department` string is
sent with no validation against a known set.

If a task references TM-105 or "department validation", the fix is to add
validation in the POST handler (and likely PATCH, which also accepts
`department` with no check — `members.ts:83-104`) against a fixed department
list, returning `400` with the existing `{ error: string }` shape. Don't just
delete or loosen the test to make CI pass — the red test is the acceptance
criterion.

## `is_active` is a dead soft-delete flag

The schema has `is_active INTEGER NOT NULL DEFAULT 1`, and `GET /api/members`
filters on `is_active = 1`, which reads like soft-delete support. But nothing
in the codebase ever sets it to `0` — `DELETE /api/members/:id`
(`members.ts:106-117`) hard-deletes the row. If a task asks to "restore" or
"deactivate" a member, the current API has no endpoint for that; you'd be
adding one, not fixing a broken one.

## CSV export doesn't escape fields

`GET /api/members/export` (`members.ts:48-58`) builds CSV with plain template
literals and `join(',')` — a `name`, `role`, or `department` containing a
comma, quote, or newline will corrupt the CSV row. There's no test covering
this. Worth flagging if a task touches the export route.

## Node runtime constraint

`node:sqlite`/`DatabaseSync` requires Node >= 22.5 (`package.json` `engines`,
`server/src/db.ts:1`). Don't suggest swapping in `better-sqlite3` or similar
without checking whether the >=22.5 constraint is still required elsewhere.
