---
name: testing-conventions
description: How server tests are structured (Node test runner, in-memory DB, no mocking library) before adding new tests
type: convention
scope:
  - server/src/**
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

`pnpm test` builds then runs compiled tests via `node --test` — see ../../CLAUDE.md for the command itself.

Derived conventions, not stated in CLAUDE.md/README:
- No test framework dependency: tests use `node:test` + `node:assert/strict` directly, no Jest/Vitest/Supertest.
- Each test spins up a real Express app on an ephemeral port (`app.listen(0)`) and hits it with `fetch`, rather than mocking `req`/`res` (server/src/routes/members.test.ts:26-53).
- Tests force `TEAMBOARD_DB_PATH=':memory:'` as a module-level side effect *before* importing the router (server/src/routes/members.test.ts:24), relying on `getDb()`'s lazy singleton (server/src/db.ts) never having been called yet. New test files must set this env var before their first import of `../db.js` or the router, or they'll touch the real `data/team.db`.
- One test is intentionally red on `main` (TM-105, department validation) — see ../knowledge/gotchas.md before "fixing" it without checking whether that's the actual task.
