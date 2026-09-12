---
name: testing
description: How TeamBoard tests are written and run — node:test, in-memory DB isolation, and test-first-red style
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

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency. `pnpm test` runs `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json:16`): tests run against **compiled JS**, not TS directly, so a test-only change still needs a successful `tsc` build to be picked up.
- Test files live next to the code they test (`server/src/routes/members.test.ts` beside `members.ts`), suffixed `.test.ts`.
- Isolate the DB per test file by setting `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, **before** any route handler runs (`members.test.ts:24`) — `getDb()` is a lazy singleton (see [[overview]]), so the env var must be set before the first call, not inside a `before()` hook if any import-time code could call it first.
- Exercise routes over real HTTP, not by calling handler functions directly: build an `express()` app, mount the router, `app.listen(0)` for an ephemeral port, `fetch()` against it, then `server.close()` in a `finally` (`members.test.ts:35-53`). Follow this helper pattern (`call()`) for new route tests rather than importing handlers and invoking `req`/`res` mocks.
- This repo writes tests **test-first and expects them to be red** until the corresponding fix lands (see the TM-105 test in [[gotchas]]) — a failing test with a comment explaining *why* it's expected to fail is an accepted, intentional state here, not a broken build to silence.
