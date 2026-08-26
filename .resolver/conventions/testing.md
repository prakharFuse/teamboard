---
name: testing
description: How server tests are structured — node:test, in-memory SQLite, ephemeral HTTP server per call
type: convention
scope:
  - server/**
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

No test framework dependency (no Jest/Vitest/Mocha) — tests use Node's built-in `node:test` + `node:assert/strict`, and only exist under `server/src/**/*.test.ts` today. `pnpm test` (`package.json`) runs `pnpm build` first, then `node --test "dist/server/**/*.test.js"` — tests run against compiled output, not `ts-node`/`tsx`, so a source-only change won't be picked up without a build.

Pattern to follow for a new route test (see `members.test.ts`):
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before importing/calling anything that touches `getDb()` — the DB singleton is created lazily on first call, so this only works if it runs before the first request.
- Build the Express app once at module scope with only the router under test mounted (`makeApp()`), not the full `server/src/index.ts`.
- For each request, `app.listen(0)` for an ephemeral port, `fetch` against it, then close the server in a `finally` — don't share one long-lived listening server across tests.

There is no client-side test setup (no Vitest/RTL config for `client/`) — `client/src/App.tsx` is currently untested.
