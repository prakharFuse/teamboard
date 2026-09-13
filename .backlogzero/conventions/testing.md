---
name: testing-conventions
description: How server tests are written and run — node:test, compiled-then-run, in-memory SQLite
type: convention
scope:
  - server/**
updated: '2026-09-13'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- **No test framework dependency.** Tests use Node's built-in `node:test` + `node:assert/strict` (`server/src/routes/members.test.ts:16-17`) — there's no Jest/Vitest/Mocha in `package.json`. Don't introduce one for new tests; follow the existing pattern.
- **Tests run against compiled output, not source.** `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json`) — TypeScript test files are compiled by `tsc` first, then executed as `.js` from `dist/server/`. A new `*.test.ts` file next to the code it tests (colocated, like `members.test.ts` beside `members.ts`) is picked up automatically as long as it's under `server/src` and matches the glob after compilation.
- **In-memory DB isolation via env var, set at module load time.** `process.env.TEAMBOARD_DB_PATH = ':memory:'` is set at the top of the test file (`members.test.ts:24`), *before* any route handler runs — `getDb()` reads this env var lazily on first call (`server/src/db.ts:7`), so it must be set before the first request, not inside a `before()`/`beforeEach()` hook.
- **Ephemeral real HTTP server per call, not supertest-style in-process requests.** The test helper `call()` (`members.test.ts:35-53`) does `app.listen(0)`, makes a real `fetch()` against the assigned port, then closes the server in a `finally`. Follow this pattern for new route tests rather than adding a new HTTP testing dependency.
- **A currently-failing test is sometimes intentional.** See [[gotchas]] — the department-validation test is deliberately RED pending TM-105. Don't delete or loosen it to make CI pass; the fix belongs in production code (`server/src/routes/members.ts`).
