---
name: testing
description: How server tests are written and run — read before adding or changing a *.test.ts file
type: convention
scope:
  - server/src/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

`pnpm test` = `pnpm build` then `node --test "dist/server/**/*.test.js"` (`package.json:16`) — Node's built-in test runner, no vitest/jest. Editing a `*.test.ts` file has no effect until it's rebuilt; running `node --test` directly against `src/**/*.test.ts` will not pick up your changes.

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before any handler calls `getDb()` (`members.test.ts:24`), to get an isolated in-memory SQLite DB. `getDb()` is a lazy singleton (`server/src/db.ts:9-16`) — it's created once per process and ignores later env changes, so every test in one run shares a single in-memory DB instance seeded once.
- No supertest: tests build a bare `express()` app that mounts only the router under test, `listen(0)` for a random free port, `fetch()` against it, and `server.close()` in a `finally` (`members.test.ts:26-53`).
