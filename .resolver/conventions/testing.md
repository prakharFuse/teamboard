---
name: testing
description: How server tests are written and run — Node's built-in test runner, in-memory SQLite, no mocking framework
type: convention
scope:
  - server/src/**/*.test.ts
updated: 2026-08-11 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest, Vitest, or Mocha.
`pnpm test` runs `pnpm build && node --test "dist/server/**/*.test.js"`, so tests execute
against **compiled output**, not source directly; a source-only change needs a build (implicit
via `pnpm test`) before the new test behavior shows up.

Per-test-file pattern (see `server/src/routes/members.test.ts`):
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before importing/using the
  router — `getDb()` is a lazy singleton (see [[architecture]]), so this only works because it
  runs before the first request touches the DB. Setting it inside a `test()` body would be too
  late if any earlier test already triggered `getDb()`.
- Build a fresh `express()` app with just the router under test mounted, start it with
  `app.listen(0)` per HTTP call, and hit it with real `fetch()` — not `supertest` or any request
  mocking. `server.close()` in a `finally` block after each call.
- No per-test DB reset/teardown: all tests in a file share one in-memory DB and its seed rows,
  so tests must not assume a pristine table (e.g. the department-validation test uses a
  `Date.now()`-suffixed email to avoid the `UNIQUE` constraint from a previous run).

When adding a test for a rejected/invalid input, assert the exact status code and, where the
error body shape matters, the exact `{ error: string }` message — not just `res.ok === false`.
