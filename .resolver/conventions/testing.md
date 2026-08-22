---
name: testing
description: How server tests are structured — Node's built-in test runner, in-memory SQLite, per-call ephemeral HTTP server
type: convention
scope:
  - server/src/**
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

`pnpm test` (`package.json:16`) builds first, then runs
`node --test "dist/server/**/*.test.js"` — tests are compiled `.ts` files,
not run directly with `ts-node` or similar. There is exactly one test file
today: `server/src/routes/members.test.ts`.

## Conventions to follow for new server tests

- No test framework dependency — use `node:test` (`test`, `before`, etc.) and `node:assert/strict`, matching `server/src/routes/members.test.ts:16-17`.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module scope, before importing/using the router, so `getDb()`'s singleton picks up the in-memory DB on its first call (see `../knowledge/gotchas.md`). Never point tests at `data/team.db`.
- Don't call the router handlers directly — build a real `express()` app (`makeApp()`, `server/src/routes/members.test.ts:26-31`), `app.listen(0)` for an ephemeral port per request, and `fetch()` against it, then `server.close()` in a `finally`. This exercises real HTTP + JSON parsing, not just handler logic.
- One `app` instance is shared across the whole file (`server/src/routes/members.test.ts:33`) — and therefore one shared in-memory DB across all tests in the file. Tests must not assume a clean DB per test; use unique values (e.g. `email: \`ci-test-${Date.now()}@company.com\``, line 75) to avoid collisions with seed data or earlier tests.

## Intentionally-red tests are a known state, not a bug

`server/src/routes/members.test.ts:70-85` fails on `main` on purpose — its
file header explains this is the expected red check for ticket TM-105
(department validation). If you're asked to "fix CI" on this repo, check
whether a red test is one of these intentional placeholders before assuming
it's a regression; see `../knowledge/gotchas.md` for which one currently
applies.
