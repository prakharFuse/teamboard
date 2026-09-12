---
name: testing
description: How TeamBoard tests are structured — node:test, in-memory SQLite, ephemeral HTTP server
type: convention
scope:
  - server/**
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Mocha/Vitest dependency for the server. Colocate test files as `*.test.ts` next to the module under test (e.g. `server/src/routes/members.test.ts` beside `members.ts`).
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at the top of the test file, before importing anything that calls `getDb()` — the DB is a lazy singleton (`server/src/db.ts:9`), so the env var must be in place before the first request hits any route.
- Don't mock Express or SQLite. Build a real `express()` app with the router mounted, `app.listen(0)` for a random free port, hit it with real `fetch()`, then `server.close()` in a `finally`. See `call()` in `members.test.ts:35-53` as the pattern to reuse.
- `pnpm test` builds first (`tsc`) then runs `node --test` against `dist/server/**/*.test.js` — tests exercise compiled output, so always rebuild before trusting a local test run after a source edit.
- A red test is sometimes intentional (see [[gotchas]] — the department-validation test). Check whether a failing test has a comment explaining it's test-first/pending a fix before "fixing" the test itself.
