---
name: testing
description: How tests are written and run in this repo — node:test, no mocking framework, in-memory SQLite
type: convention
scope:
  - server/**
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

No test framework or assertion library is installed — tests use Node's
built-in `node:test` and `node:assert/strict` only (see the import block in
server/src/routes/members.test.ts). Don't add jest/vitest/mocha/chai; follow
the existing pattern.

## Pattern used in members.test.ts

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module top level, before
  importing/using the router — `getDb()` is a lazy singleton (server/src/db.ts)
  so this only works if it runs before the first request.
- Build a throwaway `express()` app wrapping the router under test, call
  `app.listen(0)` to get a random free port, hit it with real `fetch()`
  calls, then `server.close()` in a `finally`. There's no supertest or
  similar — this is a real HTTP round trip against an ephemeral server.
- One `app`/DB instance is shared across all tests in the file (module-level
  `const app = makeApp();`), so tests are not isolated from each other's
  writes — order and shared seed state matter within a file.

## Running tests

`pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"` — tests
run against the **compiled output**, not source `.ts` files directly. If you
edit a `.ts` file and run `node --test` without rebuilding first, you'll test
stale compiled JS.
