---
name: testing
description: How tests are written and run in this repo — read before adding or modifying test files
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

- **No test framework dependency.** Tests use Node's built-in `node:test` + `node:assert/strict` (see `server/src/routes/members.test.ts`) — don't add Jest/Vitest/Mocha for new tests; follow the existing pattern.
- **Tests run against compiled output, not source.** `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` — the build step compiles `.test.ts` files alongside production code (`server/tsconfig.build.json` has no test exclusion), and the test runner only ever sees `dist/`. Adding a test file is enough; there's no separate test-compile step to configure.
- **Isolate the DB with `TEAMBOARD_DB_PATH=':memory:'`, set at module load, before any request.** `getDb()` is a lazy singleton, so setting this env var anywhere before the first call (top of the test file, outside any `test()` block) is sufficient — see [[architecture]] and [[data-model]].
- **Route-level tests spin up a real HTTP server on an ephemeral port** (`app.listen(0)`, then read `.address().port`) and call it with `fetch`, closing the server in a `finally` block. This exercises the real Express router rather than calling handler functions directly.
- **A currently-red test is expected and must not be "fixed" by weakening the assertion.** See [[gotchas]] for the department-validation test that's intentionally failing pending TM-105 — CI (`.github/workflows/ci.yml`) runs `pnpm test` on every PR and relies on this failure being genuine.
