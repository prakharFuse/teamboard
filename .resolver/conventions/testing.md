---
name: testing
description: How TeamBoard's server tests are structured — node:test, no framework, ephemeral HTTP server per test file
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

Server tests use Node's built-in `node:test` + `node:assert/strict` — no
Jest/Vitest/Mocha dependency. `*.test.ts` files live next to the code they
cover (`server/src/routes/members.test.ts` beside `members.ts`), and are
compiled to `dist/server/**/*.test.js` before running: `pnpm test` is
`pnpm build && node --test "dist/server/**/*.test.js"`.

- Point at an isolated DB by setting `process.env.TEAMBOARD_DB_PATH =
  ':memory:'` **before the first request is made** — `getDb()` is a lazy
  singleton, so the env var must be set before any route handler runs, not
  necessarily before the module loads.
- Build a throwaway Express app in-process (`makeApp()`), start it with
  `app.listen(0)` for an ephemeral port, `fetch()` against
  `127.0.0.1:<port>`, and `server.close()` in a `finally`. There is no
  supertest-style request helper — new tests should follow this same
  `call(method, path, body)` pattern rather than introducing a new library.
- There is no client-side test setup at all (no test files under
  `client/src`); don't assume one exists when asked to add tests for `App.tsx`
  changes — a new client test would need its own runner/config from scratch.
