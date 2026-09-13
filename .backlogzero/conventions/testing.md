---
name: testing-conventions
description: How TeamBoard tests are structured — runner, DB isolation, per-test server
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

- Test runner is Node's built-in `node:test` + `node:assert/strict` — no
  Jest/Vitest/Mocha. New test files should follow the same pattern:
  `import { test, before } from 'node:test'`.
- Test files are co-located with the code under test as `*.test.ts` (e.g.
  `server/src/routes/members.test.ts` next to `members.ts`), not a separate
  `test/` or `__tests__/` tree.
- Each test spins up its own ephemeral HTTP server on port 0
  (`app.listen(0)`), makes a real `fetch()` call, then closes the server in a
  `finally` block (see the `call()` helper in `members.test.ts`) — routes are
  exercised end-to-end over HTTP, not via direct handler invocation or
  supertest-style mocking.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before any
  route/`getDb()` call, to keep the test DB in-memory and isolated from
  `data/team.db`. See [[gotchas]] for why ordering here matters.
- `pnpm test` compiles first (`pnpm build`) then runs compiled `.test.js`
  files from `dist/server/` — there's no direct TS test execution path.
