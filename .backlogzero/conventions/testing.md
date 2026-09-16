---
name: testing
description: How TeamBoard's tests are written and run — node:test, no framework, in-memory DB
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

- No test framework/library — tests use Node's built-in `node:test` + `node:assert/strict` (`members.test.ts:16-17`). Don't add Jest/Vitest/Mocha for server tests; follow the existing pattern.
- A test file spins up a real Express app on an ephemeral port (`app.listen(0)`) and makes real `fetch()` calls against it (`members.test.ts:26-53`), rather than importing handler functions directly or mocking `req`/`res`.
- Isolate the DB per test file by setting `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before the first request is made** (module top-level, before `makeApp()`/`before()` block) — see [[gotchas]] for why ordering matters here.
- Test files live next to the code they test (`server/src/routes/members.test.ts` beside `members.ts`), named `*.test.ts`.
- `pnpm test` builds first, then runs `node --test` against `dist/server/**/*.test.js` — there is no watch-mode/direct-TS test runner configured.
