---
name: testing
description: How tests are written and run in this repo — read before adding or modifying tests
type: convention
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- No test framework dependency — tests use Node's built-in `node:test` + `node:assert/strict` (`server/src/routes/members.test.ts:16-17`). Don't introduce Jest/Vitest/Mocha for server tests; follow the existing pattern.
- `pnpm test` (`package.json:16`) is `pnpm build && node --test "dist/server/**/*.test.js"` — tests run against **compiled output**, not source directly. A test file added under `server/src/**/*.test.ts` is picked up automatically by `tsconfig.build.json`'s `include: ["src/**/*"]` and needs no separate registration.
- API/route tests spin up a real Express app on an ephemeral port per call rather than mocking `req`/`res`: see the `makeApp()` + `call()` helpers in `server/src/routes/members.test.ts:26-53` — each `call()` does `app.listen(0)`, fetches, then `server.close()` in a `finally`. Follow this pattern for new route tests instead of unit-testing handlers in isolation.
- Isolate test data with `process.env.TEAMBOARD_DB_PATH = ':memory:'` set at module load time, before the router is exercised — see [[gotchas]] for why ordering here matters (`getDb()` memoizes on first call).
- There is currently no client-side test setup (no test runner configured for `client/`) — `client/src/App.tsx` has no accompanying test file.
