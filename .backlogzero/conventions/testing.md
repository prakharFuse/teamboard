---
name: testing
description: How server tests are written and run in this repo — read before adding or changing tests
type: convention
scope:
  - server/**
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/
Mocha dependency (`members.test.ts:16-17`). `pnpm test` first runs the full
TypeScript build (`pnpm build`, emitting to `dist/`) and then runs
`node --test "dist/server/**/*.test.js"` (`package.json:16`) — tests execute
against **compiled output**, not source, so a test-only change still requires a
successful `tsc` build to be picked up.

Test files are colocated with the code they test (`members.test.ts` next to
`members.ts`), matched by the `dist/server/**/*.test.js` glob — follow this
placement for new route test files rather than a separate `test/` directory.

Server tests spin up a real in-process Express app on an ephemeral port per
call (`makeApp()` + `app.listen(0)`, `members.test.ts:26-31, 40`) and hit it
with `fetch`, rather than mocking the router. The DB is swapped to an in-memory
SQLite instance via `process.env.TEAMBOARD_DB_PATH = ':memory:'` set at module
load, **before** the first `getDb()` call (`members.test.ts:24`) — `getDb()` is
a lazy singleton (see [architecture](../knowledge/architecture.md)), so setting
this env var after any request has already fired is too late and will fall back
to the real `data/team.db` file. There is no client-side (`client/`) test setup
in this repo.
