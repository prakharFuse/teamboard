---
name: testing
description: How server tests isolate their database and spin up the app
type: convention
scope:
  - server/src/**
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

Tests use Node's built-in test runner (`node --test`) against the *compiled* output — `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json`). There's no ts-node/direct TS execution for tests; a stale `dist/` will run stale tests, but `pnpm test` always rebuilds first so this only bites if you invoke `node --test` directly without building.

Each test file sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` before importing/using the router (`server/src/routes/members.test.ts`), which `getDb()` (`server/src/db.ts`) checks to skip the on-disk `data/team.db` file entirely. Set this env var before any request touches `getDb()` — it's a lazy singleton, so once a connection is created the path is locked in for the process.

Tests don't hit a shared running server: each `call()` helper spins up the Express app on an ephemeral port (`app.listen(0)`) per request and closes it afterward, rather than using supertest or a persistent listener.
