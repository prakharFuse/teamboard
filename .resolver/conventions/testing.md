---
name: testing
description: How TeamBoard's server tests are written and run — no framework, in-memory DB, in-process server
type: convention
scope:
  - server/**
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
  - .github/workflows/ci.yml
---

- No test framework dependency — tests use Node's built-in `node:test` + `node:assert/strict`, per `server/src/routes/members.test.ts`. Don't reach for jest/vitest/mocha in new server tests; follow the existing pattern.
- Each test file spins up its own ephemeral Express app (`makeApp()`) and calls `app.listen(0)` per request inside a `call()` helper, closing the server in a `finally` block. Requests go over real HTTP via `fetch` to `127.0.0.1:<ephemeral port>`, not supertest-style in-memory dispatch.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at the top of the test file, before importing/using the router — see [[gotchas]] for why ordering matters (`getDb()` is a lazy singleton keyed to whatever path is set on first call).
- `pnpm test` runs `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json`) — tests run against the **compiled** output in `dist/`, not `ts-node`/on-the-fly TS. A test-only change still needs a successful `pnpm build` to be picked up by `pnpm test`.
- CI (`.github/workflows/ci.yml`) runs `pnpm typecheck`, then `pnpm lint`, then `pnpm test`, in that order, on every PR and on push to `main`. The department-validation test is expected to fail on `main` until TM-105 lands (see [[gotchas]]) — don't treat that specific failure as a sign something else is broken.
- There's no test setup for the client (`client/src/`) — no test files, test runner, or `pnpm test:client` script exist for it.
