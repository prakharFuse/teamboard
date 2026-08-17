---
name: testing
description: How server tests are structured — in-memory DB, per-test ephemeral HTTP server, no mocking framework
type: convention
scope:
  - server/src/**
updated: 2026-08-17 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

`pnpm test` is described in ../../CLAUDE.md — see there for the command. This page covers the pattern the one existing test file establishes for any new server tests.

- Use `node:test` + `node:assert/strict` directly — no Jest/Vitest/Mocha dependency for the server.
- Isolate the DB with `process.env.TEAMBOARD_DB_PATH = ':memory:'` set at module load, **before** any route handler calls `getDb()` (db.ts's singleton is created on first call, so setting the env var after that point is a no-op).
- Don't hit the app in-process with supertest-style handler calls — this repo spins up a real ephemeral server per request (`app.listen(0)`, read back the assigned port, `fetch()` it, then `server.close()`), see `call()` in members.test.ts:35-53.
- A currently-failing test can be intentional. Before "fixing" a red test, check whether it documents a tracked gap (see ../knowledge/gotchas.md's TM-105 note) rather than a regression.
