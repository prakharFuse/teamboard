---
name: testing
description: How TeamBoard's server tests are structured — no framework, in-memory DB, ephemeral HTTP server per call
type: convention
scope:
  - server/**
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency (`server/src/routes/members.test.ts:16`). There is currently exactly one test file, colocated with the code it tests (`server/src/routes/members.test.ts` next to `server/src/routes/members.ts`); follow that colocation pattern (`*.test.ts` beside the module) for new server tests rather than a separate `__tests__` tree.

Pattern to follow for a new route test file:

1. Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at the top of the file, before importing/calling anything that touches `getDb()` — the DB connection is a lazy singleton (see [[overview]]), so this must happen before the first request.
2. Build a throwaway `express()` app in-process and mount only the router under test (`makeApp()` in `members.test.ts:26`).
3. Per-call, `app.listen(0)` on an ephemeral port, `fetch` against it, then `server.close()` in a `finally` (`members.test.ts:40`) — there's no shared long-lived server across tests.
4. Assert on both `status` and the parsed JSON body, not just status.

Tests run against **compiled output**: `pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"` (package.json:16). If you add a test file that isn't picked up, check it compiled into `dist/server/` under the same relative path, not that the test runner glob is wrong.

Don't "fix" the failing `rejects an invalid department with 400` test by loosening the assertion — it's intentionally red pending TM-105. See [[known-issues]].
