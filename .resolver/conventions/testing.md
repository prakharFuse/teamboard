---
name: testing
description: How server tests are structured (no framework, in-memory SQLite, ephemeral listen server) and the TM-105 red test rule
type: convention
scope:
  - server/src/**/*.test.ts
updated: 2026-08-12 (IONE-959)
captured_sha: 1200413d009895f880bb480e9b74194c0f6b3934
sources:
  - server/src/routes/members.test.ts
---

Server tests use Node's built-in test runner (`node:test` + `node:assert/strict`)
— no Jest/Vitest/Mocha dependency. `pnpm test` runs `pnpm build` first, then
`node --test "dist/server/**/*.test.js"` (`package.json:16`), so tests execute
against compiled JS, not `ts-node` or similar.

Pattern to follow for new route tests (`members.test.ts`):
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before any
  `getDb()` call, so the suite never touches `data/team.db`.
- Build the Express app once at module scope with only the router under test
  mounted (`makeApp()`), not the full `server/src/index.ts` app.
- Each assertion spins up its own ephemeral listener via `app.listen(0)`,
  fetches against the assigned port, and closes the server in a `finally` —
  see the `call()` helper. Reuse this helper rather than adding a new HTTP
  client pattern.

TM-105 (department validation) has landed — all department tests, including
the formerly-red "rejects an invalid department with 400" case, pass on `HEAD`
now (see `[[overview]]`). There's no deliberately-red test in this suite
anymore; if you introduce one for a future ticket, comment it as clearly as
this one was so it isn't mistaken for a flake.
