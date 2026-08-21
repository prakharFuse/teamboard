---
name: testing
description: How TeamBoard tests are structured — no framework, in-memory DB, ephemeral HTTP server
type: convention
scope:
  - server/**
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

No test framework — tests use Node's built-in `node:test` + `node:assert/strict`, run against compiled output (`pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"`, package.json:16). Write new server tests as `*.test.ts` next to the code they cover (see server/src/routes/members.test.ts alongside members.ts), not in a separate `test/` tree — the build step compiles both together via `server/tsconfig.build.json`.

Pattern for route tests, following members.test.ts:
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before importing/using the router, so `getDb()`'s lazy singleton never touches the real `data/team.db` (see [[gotchas]]).
- Build a fresh `express()` app per test file, mount the router under test, `app.listen(0)` for an ephemeral port, and hit it with real `fetch()` calls — no supertest or mocked request objects.
- Close the server (`server.close()`) in a `finally` after each call.

There is no client-side test setup in this repo (no test files under `client/`).
