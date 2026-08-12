---
name: testing
description: How TeamBoard's server tests are structured — in-memory SQLite, ephemeral HTTP server per call, tests run against built JS
type: convention
scope:
  - server/**
updated: 2026-08-12 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

No test framework dependency — tests use Node's built-in `node:test` + `node:assert/strict` (`server/src/routes/members.test.ts:16-17`). Follow this pattern for new server tests rather than introducing Jest/Vitest/etc.

- Isolate the DB with `process.env.TEAMBOARD_DB_PATH = ':memory:'` set at module load, **before** any handler calls `getDb()` — `getDb()` is a lazy singleton (see [[architecture]]), so the env var must be set before the first request in the test file, not inside a `before()` hook that runs after import (`members.test.ts:24`).
- Build a fresh `express()` app per test file with just the router under test mounted (`makeApp()`, `members.test.ts:26-31`), not the real `server/src/index.ts` app.
- Exercise it over real HTTP: `app.listen(0)` for an ephemeral port, `fetch()` against it, then `server.close()` in a `finally` (`members.test.ts:40-53`) — don't call route handlers directly or use an in-process request mock.
- `pnpm test` runs `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json:16`) — tests execute against the **compiled** output in `dist/`, not `server/src/**/*.test.ts` directly. A source-only edit isn't picked up by `pnpm test` until it's rebuilt.
- New test cases must cover both a valid and an invalid/edge input where the endpoint branches on it (the existing suite already pairs "lists seeded members" with "rejects invalid department") — don't add only a happy-path assertion.
