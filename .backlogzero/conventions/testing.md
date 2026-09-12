---
name: testing
description: How TeamBoard's server tests are written and run — node:test, in-memory DB, contract-test style
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

- Tests use Node's built-in test runner (`node:test` + `node:assert/strict`)
  — no Jest/Vitest/Mocha dependency. Test files are `*.test.ts` colocated
  next to the code they cover (`server/src/routes/members.test.ts` next to
  `members.ts`); there is currently no test file for `db.ts` or for the
  client.
- Tests run against the **compiled** output, not source: `pnpm test` is
  `pnpm build && node --test "dist/server/**/*.test.js"` — a test-only
  change still requires a successful `tsc` build to be picked up by the
  test run.
- Server API tests are written as black-box contract tests: they spin up a
  real `express()` app with the router mounted (`makeApp()`), `listen(0)`
  for an ephemeral port, and use real `fetch()` calls — they don't call
  route handlers directly or mock `express`'s `Request`/`Response`.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load time,
  before constructing the app or making any request — `getDb()` caches its
  connection on first use (see [[gotchas]]), so setting the env var inside a
  `test()` body or `before()` hook is too late if anything already touched
  the DB.
- A failing/RED test can be intentional in this repo — see the TM-105 note
  in [[gotchas]] before assuming a red test in `members.test.ts` is a
  regression to silence.
