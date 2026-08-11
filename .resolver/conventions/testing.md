---
name: testing
description: How server tests are structured — in-memory DB, ephemeral HTTP server, no test framework dependency
type: convention
scope:
  - server/src/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

`pnpm test` builds first, then runs compiled tests with Node's built-in test
runner (`node --test "dist/server/**/*.test.js"` — package.json:16). There's
no Jest/Vitest/Mocha dependency for the server.

Pattern established in `server/src/routes/members.test.ts`, follow it for
new route tests:

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before
  importing/using the router — `getDb()` is a lazy singleton, so this only
  works if it happens before the first request (members.test.ts:24).
- Build a real `express()` app with just the router under test mounted, no
  mocking of Express or SQLite (`makeApp()`, members.test.ts:26-31).
- Drive requests over real HTTP: `app.listen(0)` for an ephemeral port, use
  global `fetch`, then `server.close()` in a `finally` (members.test.ts:35-53).
  Don't use `supertest` or similar — it isn't a dependency here.
- One `app`/DB instance is shared across all tests in the file (module-level
  `const app = makeApp()`, members.test.ts:33) — tests accumulate rows in the
  same in-memory DB, so use unique values (e.g. `ci-test-${Date.now()}@...`
  for email) rather than assuming a clean slate per test.
- A test can be deliberately red against a known gap — see [[gotchas]] for
  the current TM-105 case. Don't "fix" a red test by weakening its assertion
  unless the linked ticket's fix is what you're actually implementing.
