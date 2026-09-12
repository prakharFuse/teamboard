---
name: testing
description: How TeamBoard tests are written and run — node:test, in-memory sqlite, no mocking framework
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

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Mocha/Vitest. New server tests should follow the same pattern (`members.test.ts`).
- `pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"` — tests run against **compiled** output, not `ts-node`/`tsx` directly. Write `.test.ts` files colocated with the source they test (e.g. `routes/members.test.ts` next to `routes/members.ts`); the build step picks them up automatically via `tsconfig.build.json`'s `include`.
- Isolation is done by setting `process.env.TEAMBOARD_DB_PATH = ':memory:'` at the top of the test file, before any route handler can call `getDb()` — `getDb()` is a lazy singleton, so this only works if the env var is set before the first request in the test file. Don't add a `beforeEach` that resets `TEAMBOARD_DB_PATH` after other tests may have already initialized the singleton.
- Each test spins up its own ephemeral `app.listen(0)` server and calls it over real HTTP via `fetch`, rather than importing route handlers directly or using `supertest`. Follow that pattern (see the `call()` helper in `members.test.ts`) for new route tests rather than introducing a new HTTP testing library.
- There is no client-side test suite or config for one — `pnpm test` only covers `server/`.
- Not every red test is a bug in the test: see [[gotchas]] for the intentionally-failing department-validation test tied to ticket TM-105. Check a test's own comments before "fixing" it by relaxing an assertion.
