---
name: testing
description: How TeamBoard tests server routes — no test framework, in-memory DB, ephemeral HTTP server
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

- No test framework dependency (no Jest/Vitest/Mocha). Tests use Node's built-in `node:test` + `node:assert/strict`, following `server/src/routes/members.test.ts`.
- `pnpm test` runs `pnpm build && node --test "dist/server/**/*.test.js"` — tests execute against **compiled** output, not `ts-node`/source directly. A new `*.test.ts` file must live under `server/src/` (matching `tsconfig.build.json`'s `include`) to be picked up.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before any `getDb()` call, to get an isolated SQLite instance per test file — this must happen before importing/using the router, since `getDb()` caches its connection on first call (see `[[data-model]]`).
- To exercise routes over real HTTP: build a fresh `express()` app per test file (not a shared singleton import of `server/src/index.ts`), mount the router under test, `app.listen(0)` for a random free port, `fetch` against it, and close the server in a `finally` block — see the `call()` helper in `members.test.ts`.
- New route test files should follow the same one-file-per-router layout: `server/src/routes/<router>.test.ts` next to `server/src/routes/<router>.ts`.
