---
name: testing-conventions
description: How TeamBoard tests are written — no framework, in-memory SQLite, env var must be set before first getDb() call
type: convention
scope:
  - server/src/**
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- No test framework dependency: tests use Node's built-in `node:test` + `node:assert/strict` (see `server/src/routes/members.test.ts:16-17`). Don't add Jest/Vitest/Mocha for server tests — follow the existing pattern.
- Tests run against compiled output, not source: `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json:16`). A new `*.test.ts` file needs no separate registration — it's picked up by the glob once compiled — but it must live under `server/src/` so `tsc` emits it to `dist/server/`.
- Isolation pattern: set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module top level, before importing/calling anything that touches `getDb()` (`members.test.ts:24`). `getDb()` is a lazy singleton (see [[overview]]) — once it's created against a real path, setting the env var later has no effect within that process.
- Each test in `members.test.ts` spins up its own ephemeral `app.listen(0)` per HTTP call via the `call()` helper (`members.test.ts:35-53`) rather than sharing one listening server — follow this per-call server pattern for new route tests rather than introducing a shared `beforeEach` server.
- See [[gotchas]] for the one test that is intentionally failing on `main` (TM-105) — don't "fix" it by loosening the assertion; the fix belongs in `members.ts`.
