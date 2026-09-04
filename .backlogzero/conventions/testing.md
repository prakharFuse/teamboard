---
name: testing
description: How TeamBoard tests are written and run — no test framework, in-memory SQLite, ephemeral HTTP server per call
type: convention
scope:
  - server/**
updated: '2026-09-04'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency (`server/src/routes/members.test.ts:16-17`). Follow this for new server tests rather than introducing a new test framework.
- Test files live next to the code they test (`server/src/routes/members.test.ts` beside `members.ts`), compiled and run as `.js` from `dist/` via `pnpm test` (`package.json:16`: `pnpm build && node --test "dist/server/**/*.test.js"`) — there is no separate ts-node/register step, so a test only runs if `pnpm build` picks it up (it's under `server/src/**`, matched by `server/tsconfig.build.json`'s `include`).
- Each test sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before** the first `getDb()` call (`server/src/routes/members.test.ts:24`) — `getDb()` is lazy-initialized and reads that env var only on first invocation (`server/src/db.ts:7`), so setting it later than the first request has no effect.
- No supertest — each HTTP assertion starts a real server on an ephemeral port (`app.listen(0)`), fetches against `127.0.0.1:<port>`, then closes it in a `finally` (`server/src/routes/members.test.ts:35-53`, helper `call()`). Reuse this `call()` pattern for new route tests instead of adding a new HTTP-test helper.
- A test asserting current-but-intentionally-wrong behavior (red until a ticket lands) must say so in a comment referencing the ticket — see the TM-105 case in [[gotchas]] for the pattern used in `members.test.ts:1-15`.
