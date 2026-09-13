---
name: testing
description: How server tests are structured — no framework, in-memory SQLite, ephemeral HTTP server per call
type: convention
scope:
  - server/src/**
updated: 2026-09-13 (IONE-959)
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

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency
  for the server. `pnpm test` runs `pnpm build` then `node --test "dist/server/**/*.test.js"`
  (`package.json:16`), so tests execute against **compiled output**, not source directly.
- Point `TEAMBOARD_DB_PATH` to `':memory:'` at module load, before any `getDb()` call, to get an
  isolated SQLite DB per test file (`server/src/routes/members.test.ts:24`) — `getDb()` memoizes
  its connection on first call (`server/src/db.ts:9`), so setting the env var later than the first
  request is too late.
- Each HTTP assertion spins up its own ephemeral server via `app.listen(0)` and a real `fetch()`
  call, closing the server in a `finally` (`server/src/routes/members.test.ts:40-53`) — there's no
  shared supertest-style helper; new route tests should reuse the existing `call()` helper in that
  file rather than adding a new abstraction.
- CI (`.github/workflows/ci.yml`) runs `typecheck` → `lint` → `test` in that order for every PR.
  There is an intentionally-red test in `members.test.ts` (`POST /api/members rejects an invalid
  department`, tracked as TM-105) — a genuinely failing CI check is expected until department
  validation lands; don't "fix" it by weakening the assertion.
