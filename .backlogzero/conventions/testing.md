---
name: testing
description: How TeamBoard tests are written and run — no framework, node:test only
type: convention
scope:
  - server/**
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- No test framework dependency (no Jest/Vitest/Mocha) — tests use Node's
  built-in `node:test` + `node:assert/strict`, per
  `server/src/routes/members.test.ts:16-17`.
- Tests run against **compiled output**, not source: `pnpm test` is `pnpm
  build && node --test "dist/server/**/*.test.js"` (package.json:16). A
  `.test.ts` file with no corresponding compile step won't be picked up.
- Route tests spin up a real, ephemeral `express()` app on `app.listen(0)`
  (random port) per request and hit it with `fetch` — see the `call()`
  helper in `members.test.ts:35-53`. There's no supertest-style in-process
  request; it's a real HTTP round-trip, and the server is closed in a
  `finally` after every call.
- Tests force an in-memory DB via `process.env.TEAMBOARD_DB_PATH = ':memory:'`
  set at module load time, before any route is exercised — see the
  `getDb()` singleton caveat in [[gotchas]].
- New route tests should follow the same shape: one `test()` block per
  behavior (happy path and each rejection case as separate tests, not
  combined), asserting on both `status` and the parsed `json` body.
