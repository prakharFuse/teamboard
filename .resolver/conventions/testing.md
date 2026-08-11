---
name: testing
description: How server tests are structured — no test framework, in-memory DB, ephemeral HTTP server
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

The only existing test file, `server/src/routes/members.test.ts`, sets the pattern for server
tests — there's no Jest/Vitest/etc. dependency in `package.json`:

- Use Node's built-in `node:test` and `node:assert/strict` (`import { test, before } from
  'node:test'`), not a third-party framework.
- Point the router at an isolated DB by setting `process.env.TEAMBOARD_DB_PATH = ':memory:'` at
  module load time, *before* any request triggers the lazy `getDb()` singleton
  (`server/src/routes/members.test.ts:24` — see [[architecture]] for why `getDb()`'s lazy-init
  makes this ordering matter). Never let a test touch `data/team.db`.
- Build a real Express app in-process (`express() + app.use('/api/members', membersRouter)`),
  `.listen(0)` for a random free port, `fetch()` against it, then `server.close()` in a `finally`
  block — don't call route handlers directly or mock `req`/`res`.
- `pnpm test` runs `pnpm build` first, then `node --test "dist/server/**/*.test.js"` — tests run
  against **compiled output**, not `ts-node` or an in-source loader. A new `*.test.ts` file only
  gets picked up once it compiles into `dist/server/**` via `server/tsconfig.build.json`'s
  `include`/`rootDir`.

There is no client-side test setup (no test file under `client/src/`) — don't assume one exists
when adding client tests; it would need to be introduced from scratch (test runner, config, etc).
