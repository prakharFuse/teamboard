---
name: testing
description: How TeamBoard's server tests are structured — no framework, in-memory DB, and the intentional RED test
type: convention
scope:
  - server/**
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- No test framework dependency — use Node's built-in `node:test` and `node:assert/strict`, matching `server/src/routes/members.test.ts`.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before any route handler runs. `getDb()` (`server/src/db.ts:11`) is a lazy singleton read once per process — setting the env var after the first `getDb()` call has no effect.
- Spin up an ephemeral in-process server per request via `app.listen(0)` and read the assigned port from `server.address()`; close it in a `finally`. See `makeApp()`/`call()` in `members.test.ts:26-53` for the pattern to follow for new route tests.
- Tests run against **compiled JS** (`dist/server/**/*.test.js`), not source — `pnpm test` always builds first. Don't run `node --test` directly against source or stale `dist/` output.
- `POST /api/members rejects an invalid department with 400` is deliberately RED on `main` pending TM-105 (see [[overview]]). Don't delete, skip, or loosen this test to make CI green — the fix belongs in `members.ts`'s validation logic, not the test.
