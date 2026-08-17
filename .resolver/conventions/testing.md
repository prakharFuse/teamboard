---
name: testing
description: How members.test.ts is structured and why one case is intentionally red
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

Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest
on the server. `pnpm test` builds first, then runs
`node --test "dist/server/**/*.test.js"` (package.json), so tests execute
compiled output, not source directly.

Each test spins up the real Express app (`membersRouter` mounted, no mocking)
on an ephemeral port via `app.listen(0)`, against an in-memory DB
(`TEAMBOARD_DB_PATH=':memory:'` set at module load, before any `getDb()`
call). Follow this pattern for new route tests: real router + in-memory
SQLite + `fetch` against a random port, rather than unit-testing handlers in
isolation.

The `rejects an invalid department` test is deliberately red on `main`
pending TM-105 — see ../knowledge/overview.md. Don't "fix" it by loosening
the assertion; the fix belongs in the route's validation logic.
