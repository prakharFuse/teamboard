---
name: testing
description: How server tests are structured — read before adding or modifying server/src/**/*.test.ts
type: convention
scope:
  - server/**
updated: 2026-08-04 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/routes/members.test.ts
  - package.json
---

Tests use Node's built-in test runner (`node --test`), not Jest/Vitest/Mocha — no test
framework dependency. `pnpm test` runs `pnpm build` first, then executes compiled
`dist/server/**/*.test.js` (`package.json:16`), so a test file must live under `server/src/`
alongside the code it tests (e.g. `server/src/routes/members.test.ts` next to `members.ts`)
and will only run after `tsc` compiles it to `dist/`.

## Per-test isolation pattern

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before any `getDb()`
  call — `getDb()` caches the `DatabaseSync` instance in a module-level `db` variable
  (`server/src/db.ts:9`), so the env var must be set before the first request touches it.
- Build the Express app once per test file with a local `makeApp()` helper, mounting only
  the router under test (no full `server/src/index.ts` app import).
- Each HTTP assertion spins up an ephemeral server on an OS-assigned port
  (`app.listen(0)`), fetches against `http://127.0.0.1:${port}`, and closes the server in a
  `finally` block — see the `call()` helper in `members.test.ts:35-53`. Reuse this helper
  pattern rather than importing supertest or similar.

## Red tests are sometimes intentional

Not every failing test is a bug to silence — see [gotchas](../knowledge/gotchas.md) for the
TM-105 department-validation test, which is red by design until the corresponding
production-code fix lands.
