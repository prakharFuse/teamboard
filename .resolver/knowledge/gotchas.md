---
name: gotchas
description: Known-broken behaviors in members.ts/db.ts — the intentionally-red CI test, unvalidated department, and a JSON-error-contract violation
type: knowledge
scope:
  - server/src/**
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
---

- **`POST /api/members` accepts any `department` string with no validation.** `server/src/routes/members.ts:26-46` inserts whatever `department` the caller sends — there's no enum check. `server/src/routes/members.test.ts:70-85` asserts a 400 for `department: 'NotARealDepartment'` and is *intentionally failing on `main`* (tracked as TM-105, per the test file's own comment); `.github/workflows/ci.yml` runs this test on every PR by design, so any PR touching this area will see a real red check until department validation is added.
- **Seed data already has the inconsistency this validation would catch:** `server/src/db.ts:40,44` insert `'Eng'` for David Kim and Hiro Tanaka while `db.ts:37` uses `'Engineering'` for Alice Chen — `/api/members/stats`' `GROUP BY department` currently reports these as two separate departments.

Diverges from CLAUDE.md: CLAUDE.md's Rules section states API errors are always `{ "error": string }` with an appropriate status → in reality, `PATCH /api/members/:id` (`server/src/routes/members.ts:83-104`) has no try/catch around its `UPDATE`, unlike `POST /` which explicitly catches the SQLite `UNIQUE` violation (lines 39-44). A `PATCH` that sets `email` to one already used by another row throws synchronously inside the handler and falls through to Express's default (HTML, not JSON) error response instead of a `409`.

- **CSV export doesn't escape fields.** `GET /api/members/export` (`server/src/routes/members.ts:48-58`) joins raw column values with commas and no quoting/escaping — a `name` or `department` containing a comma, quote, or newline will corrupt the CSV's column alignment for that row and everything after it.
- **`getDb()` is a lazy singleton, not a per-test fixture.** `server/src/db.ts:9-16` caches the `DatabaseSync` handle in a module-level `let db`. Tests rely on setting `process.env.TEAMBOARD_DB_PATH = ':memory:'` as a top-level statement *before* the first request is made (see `members.test.ts:24`) — since the router only calls `getDb()` lazily on first request, this works, but setting the env var inside a `before()` hook that runs after other import-time side effects, or writing a second test file that also imports `members.js` in the same process, would silently reuse whichever DB was opened first.
