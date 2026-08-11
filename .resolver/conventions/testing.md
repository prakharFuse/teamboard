---
name: testing
description: How TeamBoard's tests are structured — read before adding or changing a server test
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

Tests use Node's built-in test runner (`node --test`) against compiled output —
`pnpm test` runs `pnpm build` first, then `node --test "dist/server/**/*.test.js"`
(`package.json`). There's no Jest/Vitest/Mocha dependency for the server.

Pattern used in `members.test.ts` (the only test file today) — follow it for new
route tests rather than introducing a different style:
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module top level, before
  building the Express app or importing anything that calls `getDb()`. This must
  happen before the first request — see [[gotchas]] on why setting it later is a
  no-op.
- Build a throwaway `express()` app in-process, mount the router under test, and
  spin it up with `app.listen(0)` per request via a `call(method, path, body)`
  helper that opens a real HTTP connection over `fetch` and closes the server in a
  `finally`. There's no supertest dependency — plain `fetch` against an ephemeral
  port is the existing pattern.
- One `test(...)` per behavior, asserting exact status codes (e.g.
  `assert.equal(res.status, 400, ...)`), not just "not 200" or loose truthy checks.

CI (`.github/workflows/ci.yml`) runs `pnpm typecheck`, `pnpm lint`, then `pnpm test`
on every PR and on push to `main` — a new red test blocks the same way the existing
TM-105 test does (see [[gotchas]]).
