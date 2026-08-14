---
name: gotchas
description: Non-obvious behavior in TeamBoard that looks like a bug but is either intentional or a known gap — read before "fixing" any of it
type: knowledge
scope: global
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/routes/members.ts
  - server/src/db.ts
---

## The failing department-validation test is intentional (TM-105)

`server/src/routes/members.test.ts` has a test, `'POST /api/members rejects an invalid department with 400'`, that is RED on `main` by design: `POST /api/members` (in `server/src/routes/members.ts`) inserts whatever `department` string the caller sends, with no whitelist or `CHECK` constraint. The test file's own header comment and `.github/workflows/ci.yml` both call this out explicitly — it exists to give CI a real, readable failing check tied to ticket TM-105 (add department validation). Do not "fix" this by loosening or deleting the test; the correct fix is to add real validation to `POST /api/members` (and decide whether `PATCH /api/members/:id` needs the same check, since it currently accepts any `department` value too).

## DELETE hard-deletes despite the `is_active` column

`DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) runs `DELETE FROM members WHERE id = ?` — a real row removal. The `is_active` column exists and is used to filter `GET /api/members` and `GET /api/members/stats`, but nothing in the codebase ever sets `is_active = 0`; there is no soft-delete path. If a future change needs "remove" to be reversible or auditable, this handler needs a rewrite, not a wrapper.

## CSV export does no field escaping

`GET /api/members/export` builds CSV with a template-literal join (`server/src/routes/members.ts:48-58`), not a CSV library. Any `name`, `role`, or `department` containing a comma, quote, or newline will produce a malformed row (or shift columns) — there is no quoting/escaping logic at all. `POST`/`PATCH` don't restrict these fields' characters, so bad input is reachable end-to-end via the Add Member form in `client/src/App.tsx`.

## PATCH silently ignores `start_date` and `is_active`

`PATCH /api/members/:id` only reads `name`, `email`, `role`, `department` from the body (`server/src/routes/members.ts:92`) — a caller sending `start_date` gets a 200 with no error and no change applied to that field. There is no field-name validation rejecting unknown/unsupported keys.

## Tests require the DB env var set before the first `getDb()` call

`server/src/routes/members.test.ts` sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load time, before importing/using the router. `getDb()` is a lazy singleton (see [[overview]]) — once it's created with a real file path, later changing the env var has no effect for the rest of the process. Any new test file must set the env var before its first request, not inside a `before()` hook that runs after other code may have touched the DB.
