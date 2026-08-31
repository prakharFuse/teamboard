---
name: testing
description: How server tests are structured — read before adding or modifying route tests
type: convention
scope:
  - server/**
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Mocha/Vitest dependency for the server.
- Each test file sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, **before** any route handler runs — `getDb()` is lazy, so this only works if the env var is set before the first request in that process. Any new test file touching `members.ts` needs the same line.
- Requests go over real HTTP, not supertest-style in-process calls: the test's `call()` helper (`server/src/routes/members.test.ts:35-53`) does `app.listen(0)`, fetches the ephemeral port, then closes the server in a `finally`. Follow this pattern for new route tests rather than introducing a different HTTP-testing library.
- Tests run against **compiled JS in `dist/`**, not the `.ts` sources — `pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"`. A `.test.ts` edit requires a rebuild before `pnpm test` picks it up; running `node --test` directly on `dist/` without rebuilding will silently test stale code.
- CI (`.github/workflows/ci.yml`) runs `typecheck`, `lint`, then `test` in that order, all via `pnpm`, gated by `pnpm install --frozen-lockfile` — don't add scripts that mutate `pnpm-lock.yaml` as part of CI.
