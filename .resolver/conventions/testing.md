---
name: testing
description: How server tests are structured — read before adding or modifying a members.test.ts-style test
type: convention
scope:
  - server/**
updated: '2026-08-05'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - package.json
---

Test runner and invocation (`pnpm test` → build then `node --test`) are already
documented in [CLAUDE.md](../../CLAUDE.md) — this page covers the in-file pattern,
which isn't written down anywhere else.

- **No test framework dependency.** `server/src/routes/members.test.ts` uses only
  `node:test` and `node:assert/strict` — don't add jest/vitest/mocha for new
  server tests, follow the existing built-in-runner pattern.
- **Isolate the DB with `TEAMBOARD_DB_PATH=':memory:'` before the first request.**
  `getDb()` (`server/src/db.ts:11`) lazily opens and caches the connection on its
  first call, so setting `process.env.TEAMBOARD_DB_PATH` at module load time
  (before any route handler runs) is sufficient and must happen before the first
  `call()` — setting it inside a `test()` body would be too late if an earlier
  test already triggered `getDb()`.
- **Spin up a real ephemeral HTTP server per request, don't call handlers
  directly.** The `call()` helper builds one `express()` app at module scope,
  then per-call does `app.listen(0)` → `fetch` against the assigned port →
  `server.close()` in a `finally`. This exercises real routing/JSON
  parsing/status codes rather than unit-testing handler functions in isolation.
- **Name tests as the observable contract, including known-red ones.** The
  existing red test's name states the expected behavior ("rejects an invalid
  department with 400"), not the current behavior — see [[gotchas]] for why
  it's expected to fail on `main` right now.
