---
name: testing
description: How TeamBoard tests are written/run, and the one intentionally-red test in CI
type: convention
scope:
  - server/**
updated: 2026-09-14 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha. A test file (`server/src/routes/members.test.ts`) builds a real `express()` app with the router under test mounted, starts it on an ephemeral port (`server.listen(0)`), and makes real `fetch()` calls against it rather than using supertest or similar (`members.test.ts:26-53`).

Tests set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before the first `getDb()` call, to get an isolated in-memory SQLite DB per test run (`members.test.ts:24`, `db.ts:7`). Any new test file that imports `getDb`-backed routers must set this env var before the first request is made, since `getDb()` memoizes on first call.

There is currently exactly one test file, colocated with the route it tests (`server/src/routes/members.test.ts` next to `server/src/routes/members.ts`) — follow this colocation pattern for new route tests rather than a separate `__tests__/` or top-level `test/` directory.

Tests only run against **compiled** output: `pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json:16`). Editing a `.test.ts` file has no effect on `pnpm test` until a build runs — there's no `ts-node`/watch-mode test runner configured.

## Known intentionally-red test

`members.test.ts:70-85` ("POST /api/members rejects an invalid department with 400") is deliberately failing on `main` today per its own header comment (`members.test.ts:1-15`): `POST /api/members` currently accepts any `department` string with no validation. The test is tracked against ticket **TM-105** (add department validation) and is meant to turn green once that validation ships — do not "fix" it by loosening the assertion or deleting it; the fix belongs in `server/src/routes/members.ts`'s `POST /` handler.
