---
name: testing
description: How server tests are written and run (node:test, in-memory sqlite, compiled-JS test run) — read before adding tests
type: convention
scope:
  - server/src/**
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- Tests use Node's **built-in test runner** (`node:test` +
  `node:assert/strict`) — there is no Jest/Mocha/Vitest dependency in
  `package.json`. Import `{ test, before }` from `node:test`.

- `pnpm test` runs `pnpm build` first, then
  `node --test "dist/server/**/*.test.js"` — tests execute against the
  **compiled output**, not the `.ts` sources directly. A new `*.test.ts`
  file under `server/src/` needs no separate wiring: `tsc` picks it up via
  `server/tsconfig.build.json`'s `include`, and the glob finds the compiled
  `.test.js`.

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at **module scope**,
  before any router/handler is exercised (see
  `server/src/routes/members.test.ts:24`) — `getDb()` reads the env var
  once, lazily, on first call, so setting it later or per-test is too late.

- Each test spins up an ephemeral `express()` app on a random port
  (`app.listen(0)`), makes a real `fetch()` call, and closes the server in
  a `finally` block (`server/src/routes/members.test.ts:35-53`) — reuse the
  `makeApp()`/`call()` helpers already in that file rather than writing new
  ones per test file.

- One `test()` per behavior/equivalence class (e.g. one for the happy path,
  one for the invalid-department 400) — see [[gotchas]] for why the
  invalid-department test is currently expected to fail on `main`.
