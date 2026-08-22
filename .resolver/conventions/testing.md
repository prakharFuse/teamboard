---
name: testing
description: How TeamBoard's server tests are structured (ephemeral in-process server, in-memory SQLite, compiled-output execution) — follow this pattern for new route tests
type: convention
scope:
  - server/src/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

`pnpm test` runs `pnpm build` first, then `node --test "dist/server/**/*.test.js"` — tests execute against **compiled output**, not source. A test file added under `server/src/` won't run until it's picked up by the `tsc -p server/tsconfig.build.json` build (already covered by the existing `include: ["src/**/*"]`), so no extra config is needed for new `*.test.ts` files in `server/src/`.

## Pattern used by `members.test.ts`

- Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency for the server.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before** importing the router module (top of the test file, before any `getDb()` call fires) — see the DB singleton note in `../knowledge/architecture.md`. Setting it later has no effect.
- Build a throwaway `express()` app mounting just the router under test, `app.listen(0)` for an ephemeral port per call, and hit it with real `fetch()` calls — not `supertest` or handler-level unit calls.
- One `call(method, path, body)` helper per test file that opens and closes the listener per request (see `members.test.ts:35-53`).

Follow this same shape for new route test files rather than introducing a different HTTP-testing library.
