---
name: testing
description: How TeamBoard server tests are structured — Node's built-in test runner, in-memory SQLite, ephemeral HTTP server per call
type: convention
scope:
  - server/src/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
---

`pnpm test` runs `tsc` build then `node --test "dist/server/**/*.test.js"` (see ../../CLAUDE.md) — no Jest/Vitest/Mocha. Tests are colocated `*.test.ts` files next to the code they cover (`server/src/routes/members.test.ts` next to `members.ts`).

The one existing test file establishes the pattern to follow for new server tests:

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before** importing/calling anything that touches `getDb()` — the DB is a lazy singleton (`server/src/db.ts:11`), so this must happen at module load time, not inside a test body.
- Build the Express app once at module scope with only the router under test mounted (`makeApp()` mounts just `membersRouter`, not the full `server/src/index.ts` app).
- Each assertion spins up its own ephemeral server via `app.listen(0)`, reads the OS-assigned port from `server.address()`, does a real `fetch()` against `http://127.0.0.1:<port>`, and closes the server in a `finally` block — no supertest or mocked `req`/`res`.
- A test can be checked in **intentionally failing** to represent an open ticket: `members.test.ts:70-85` is RED on `main` on purpose (see [[gotchas]]), with a comment explaining which ticket (TM-105) will make it pass. Don't "fix" a red test by weakening its assertion — check whether it's tracking real open work first.
