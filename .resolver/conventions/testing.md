---
name: testing
description: How server tests are structured — Node test runner, in-memory DB, ephemeral HTTP server per call
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

Server tests use Node's built-in test runner (`node --test`), run against compiled output — `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"`. There's no Jest/Vitest/Mocha dependency for the server; don't introduce one for a new test file without checking with the user first, since the existing pattern is deliberately dependency-free.

Pattern established in `members.test.ts` for a new route test file:
1. Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module top-level, before building the app — `getDb()` is lazy, so this must happen before the first request, not inside a `before()` hook (see [[gotchas]]).
2. Build one shared `express.Express` app per test file with `express.json()` + the router under test mounted at its real path.
3. Per request, `app.listen(0)` to get an ephemeral port, `fetch()` against `http://127.0.0.1:${port}`, then `server.close()` in a `finally` — see the `call()` helper. This avoids supertest as a dependency.
4. Assert on `{ status, json }` — errors are `{ error: string }` per the convention in CLAUDE.md's Rules section.

When adding tests for new behavior, follow the file's existing convention of naming the test after the exact expected status/behavior (e.g. `'POST /api/members rejects an invalid department with 400'`), and prefer one `test()` per behavior/status code rather than bundling multiple assertions about different responses into one test.
