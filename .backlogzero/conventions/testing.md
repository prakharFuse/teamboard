---
name: testing
description: How TeamBoard tests are structured — runner, isolation strategy, and where to add new tests
type: convention
scope:
  - server/**
updated: 2026-09-04 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- No test framework dependency — tests use Node's built-in `node:test` + `node:assert/strict`, run via `node --test` against the **compiled** `dist/server/**/*.test.js` (see [[gotchas]] on stale-build risk). There's no vitest/jest config to reach for.
- Isolation pattern: each test file sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load time (before any route handler can call `getDb()`), builds a fresh in-process Express app with `app.listen(0)` per request via a `call()` helper, and closes the server in a `finally`. Follow this pattern for new route test files rather than sharing a server instance across tests or pointing at the real `data/team.db`.
- Test file naming/location: colocated next to the route file as `*.test.ts` (e.g. `server/src/routes/members.test.ts` next to `members.ts`), not a separate `__tests__/` or top-level `test/` directory.
- New route tests should cover both a success path and at least one error/validation path in separate `test(...)` blocks — see the existing file's split between the "lists seeded members" (happy path) and "rejects an invalid department" (validation, currently red per TM-105) tests as the pattern to extend.
