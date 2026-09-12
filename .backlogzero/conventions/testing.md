---
name: testing
description: How server tests are structured — node:test, in-memory SQLite, ephemeral HTTP server per test
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

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency. Co-locate as `*.test.ts` next to the source file it covers (e.g. `server/src/routes/members.test.ts` beside `members.ts`).
- `pnpm test` runs `pnpm build` first, then `node --test "dist/server/**/*.test.js"` — tests execute against **compiled** output, not `ts-node` or an in-process TS loader. A test edit isn't picked up until the next build.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module top level, before importing the router under test — `getDb()` reads this env var lazily on first call, so setting it after the first request would be too late.
- Spin up the Express app per-call with `app.listen(0)` (OS-assigned port), `fetch` against it, then `server.close()` in a `finally` — see the `call()` helper in `members.test.ts`. Don't hold one server open across the whole test file.
- There is currently one intentionally-failing test tracked as TM-105 — see [[gotchas]] before treating any red test as a bug in the test itself.
