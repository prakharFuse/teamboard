---
name: testing
description: How TeamBoard's server tests are structured — no framework, in-memory DB, ephemeral HTTP server per test
type: convention
scope:
  - server/**
updated: 2026-08-05 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/routes/members.test.ts
  - package.json
---

No test framework dependency — `pnpm test` runs `pnpm build` then Node's
built-in test runner (`node --test`) against compiled `dist/server/**/*.test.js`.
Tests are written against compiled JS, not run directly against TS.

Pattern established in `server/src/routes/members.test.ts` (the only test file
today) — follow it for new route tests:

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, **before**
  any request is made — `getDb()` is a lazy singleton (see [[architecture]]),
  so this only works if it happens before the first call.
- Build the Express app once at module scope with only the router under test
  mounted (`makeApp()`), not the full `server/src/index.ts` app.
- Each test spins up its own ephemeral server via `app.listen(0)` (random
  free port), makes a real `fetch()` call, and closes the server in a
  `finally` block — no supertest or similar, real HTTP round-trips.
- Assertions use `node:assert/strict`, checking both `status` and `json` body
  shape, with a descriptive message on the failing assertion (see the TM-105
  test in `members.test.ts:80-84`) so a CI failure is self-explanatory.

When adding a test for a case that's expected to currently fail (test-first,
like the TM-105 case — see [[gotchas]]), leave a comment explaining *why* it's
red and what would make it pass, matching the header comment style already in
`members.test.ts:1-15`.
