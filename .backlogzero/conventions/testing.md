---
name: testing
description: How TeamBoard tests are written — no framework, ephemeral in-memory server per call
type: convention
scope:
  - server/**
updated: 2026-09-04 (IONE-959)
captured_sha: 5635cd0b7f7bfd5a748edb97b564409088129f7d
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- **No test framework dependency.** Tests use Node's built-in `node:test` + `node:assert/strict` (see `server/src/routes/members.test.ts`). Don't add Jest/Vitest/Mocha for new server tests — follow the existing pattern.
- **Isolated DB via `TEAMBOARD_DB_PATH=':memory:'`, set at module load, before any request.** `getDb()` in `server/src/db.ts` lazily initializes on first call and caches the connection in a module-level variable, so the env var must be set before the first handler invocation in a test file — setting it in a `before()` hook is too late if anything upstream already called a route. The existing test sets it as a top-level statement immediately after imports.
- **Each HTTP call in a test spins up its own ephemeral `app.listen(0)` server and tears it down in a `finally`.** There's no shared `supertest`-style helper — see the `call()` function in `members.test.ts`. Follow this same shape for new route tests rather than introducing a new test-server pattern.
- **Test files live next to the code they test** (`server/src/routes/members.test.ts` next to `members.ts`), and are picked up by `node --test "dist/server/**/*.test.js"` after `pnpm build` — so a new `foo.test.ts` under `server/src/` needs no separate registration, just co-location.
