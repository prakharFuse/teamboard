---
name: testing
description: How tests are structured and run — Node test runner against compiled output, in-memory DB
type: convention
scope: global
updated: '2026-08-13'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
  - .github/workflows/ci.yml
---

`pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"` (see `package.json`) — tests run against **compiled JS**, not source directly. If you add a `*.test.ts` file, it must be under `server/src/` so `tsc` picks it up in the build; there is no separate test-compile step.

## Test structure (from `server/src/routes/members.test.ts`)

- No test framework dependency — uses Node's built-in `node:test` + `node:assert/strict`.
- Each test file sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before** importing/using the router, since `getDb()` reads that env var lazily on first call. Set it at module top level, before any `call()`.
- Tests spin up a real in-process Express app per test file (`app.listen(0)`, ephemeral port) and hit it with `fetch` — not supertest, not mocked handlers. Follow this pattern for new route tests rather than unit-testing handlers directly, since handlers aren't exported individually.
- The seeded 8 rows (from `db.ts`) are present in every test run because `getDb()` seeds on first open, including in `:memory:` mode.

## The repo intentionally ships one RED test

`"POST /api/members rejects an invalid department with 400"` fails on `main` today because department validation (ticket TM-105) hasn't landed — see `[[overview]]` and the comment block at the top of `members.test.ts`. This is deliberate, not a flake: CI (`.github/workflows/ci.yml`) is expected to show this failing until TM-105 is resolved. Don't "fix" it by loosening the assertion — fix it by adding the validation in `members.ts`, and remember the seed data has a `'department': 'Eng'` vs `'Engineering'` inconsistency (see `[[data-model]]`) that any allow-list needs to account for.
