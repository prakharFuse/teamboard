---
name: testing
description: How server tests are structured — no test framework, in-memory SQLite, real HTTP calls
type: convention
scope:
  - server/**
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

`pnpm test` runs `pnpm build` then `node --test "dist/server/**/*.test.js"` — tests are plain
Node built-in `node:test` files compiled alongside the app, not a separate framework
(no jest/vitest/mocha dependency in `package.json`).

Pattern used in `server/src/routes/members.test.ts`, follow it for new route tests:

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module top level, before importing/using
  the router — `getDb()` in `db.ts` reads this env var lazily on first call, so it must be set
  before the first request, not inside a `before()` hook.
- Don't call the Express app in-process with a mock request object — spin up a real listener
  per call (`app.listen(0)`, read the assigned port from `server.address()`, `fetch()` it, then
  `server.close()`). This exercises real HTTP + JSON parsing, not just handler logic.
- One shared `app` per test file is fine since each in-memory DB is process-local and tests run
  sequentially against it — there's no per-test DB reset.
