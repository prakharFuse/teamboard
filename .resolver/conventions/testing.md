---
name: testing
description: How TeamBoard tests are written and run — Node test runner, colocated *.test.ts, in-memory SQLite
type: convention
scope:
  - server/**
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

Tests are `*.test.ts` files colocated next to the source they cover (e.g. `server/src/routes/members.test.ts` next to `server/src/routes/members.ts`), using Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency for the server.

`pnpm test` = `pnpm build && node --test "dist/server/**/*.test.js"` (../../CLAUDE.md) — tests run against the **compiled JS in `dist/`**, so a source-only edit isn't picked up until you rebuild; there's no `ts-node`/watch-mode test path.

Each test file:
- Sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before** any route handler runs, so `getDb()`'s first (memoized) call opens an in-memory SQLite DB instead of touching `data/team.db` (`server/src/db.ts:7`, `server/src/routes/members.test.ts:24`).
- Builds a throwaway Express app (`express.json()` + the router under test only, no CORS/other middleware).
- Starts it with `app.listen(0)` per HTTP call in a helper (`call()`), reads `server.address()` for the ephemeral port, and closes the server in a `finally` block.

When adding a test-first (RED) case for a not-yet-built feature, follow the existing pattern: a comment stating which ticket makes it green and why it currently fails (see the department-validation test in `members.test.ts`, described in [[gotchas]]) — don't silently downgrade a failing assertion to make CI pass.
