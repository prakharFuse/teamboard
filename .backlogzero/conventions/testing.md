---
name: testing
description: How TeamBoard tests are written and run — read before adding or modifying tests
type: convention
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency. Follow this pattern (`test(...)`, `assert.equal`/`assert.ok`) rather than introducing a new framework.
- Server tests spin up a real in-process Express app on an ephemeral port (`server/src/routes/members.test.ts:26-53`, `app.listen(0)`) and hit it with `fetch`, rather than mocking Express — prefer this over supertest-style mocking for new route tests.
- Tests run against **compiled output**: `pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"`. A `.test.ts` file must live under `server/src/` next to the code it tests so `tsc` picks it up via `server/tsconfig.build.json`'s `include`.
- Isolate the DB with `process.env.TEAMBOARD_DB_PATH = ':memory:'` set at **module load time**, before any route handler runs — see the gotcha in [[gotchas]] about `getDb()` memoization.
- There is no client-side test setup (no test runner configured for `client/`) — only the server has tests today.
