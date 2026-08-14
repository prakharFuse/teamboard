---
name: testing
description: How server tests are structured — Node test runner, in-memory DB, ephemeral HTTP server
type: convention
scope:
  - server/**
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

`pnpm test` runs `pnpm build` then `node --test "dist/server/**/*.test.js"` (see CLAUDE.md) — tests run against compiled JS, not `ts-node`/`tsx`, so a test-only syntax error still needs `pnpm build` to surface.

Pattern used in `server/src/routes/members.test.ts` (the only test file today):

- Use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency exists in `package.json`.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before** any handler calls `getDb()` (it's read lazily on first call, module-level `let db` is cached after that) — this keeps tests off the real `data/team.db` file.
- Don't import the Express `app` from `server/src/index.ts` (it calls `app.listen` at import time on the fixed port `4060`). Instead build a fresh `express()` app in the test file, mount only the router under test, and `.listen(0)` for a random free port per request — see the `makeApp()` / `call()` helpers.
- One shared in-memory DB / seed data across all tests in the file (SQLite `:memory:` persists for the process, not per-test) — tests must not assume a clean table between cases, and should generate unique values (e.g. `` `ci-test-${Date.now()}@company.com` ``) to avoid the `email UNIQUE` constraint colliding with other tests or seed rows.

See [[gotchas]] for the one test that is intentionally RED on `main` (department validation, TM-105) — do not treat a failing `pnpm test` as evidence something you changed broke it without checking that test first.
