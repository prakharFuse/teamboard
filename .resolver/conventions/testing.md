---
name: testing
description: How tests are written and run in TeamBoard — no framework, in-memory SQLite, ephemeral server per call
type: convention
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

`pnpm test` (see `../../CLAUDE.md`) builds then runs compiled tests with
Node's built-in test runner. What that entry doesn't spell out is the pattern
tests actually follow — inferred from `server/src/routes/members.test.ts`,
the only test file in the repo:

- No test framework/library dependency (no Jest/Vitest/Supertest) — just
  `node:test`, `node:assert/strict`, and raw `fetch`.
- Isolation from the dev DB is via `process.env.TEAMBOARD_DB_PATH = ':memory:'`
  set at module load, *before* any request triggers `getDb()` (`getDb()` is a
  lazy singleton — see [[architecture]]). Any new test file that hits the DB
  needs this same env var set before its first request, or it'll touch
  `data/team.db`.
- Each HTTP assertion spins up its own ephemeral server with
  `app.listen(0)` (OS-assigned port), makes one `fetch`, then calls
  `server.close()` in a `finally` — there's no shared `supertest`-style app
  instance kept open across the file.
- Test files live next to the code they test (`members.ts` /
  `members.test.ts` in the same `routes/` dir), matched by the `test` script's
  glob `dist/server/**/*.test.js` — so any new suite must also follow the
  `*.test.ts` naming convention to be picked up.
