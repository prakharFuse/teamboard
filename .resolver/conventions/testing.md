---
name: testing
description: Non-obvious mechanics of the Node-test-runner suite — read before adding or debugging a test
type: convention
scope:
  - server/src/**
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

`../../CLAUDE.md` already documents the command (`pnpm test` builds, then runs
`node --test` over compiled output). Mechanics worth knowing:

- **Tests run against `dist/`, not `src/`.** `pnpm test` = `pnpm build && node
  --test "dist/server/**/*.test.js"`. Editing a `.test.ts` and re-running
  `node --test` directly on the TS source does nothing useful — you must
  rebuild (or rerun `pnpm test`) first.
- **The in-memory DB switch must land before the first `getDb()` call.**
  `members.test.ts` sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` as a
  top-level statement, before importing/using the router. `getDb()`
  (`server/src/db.ts`) lazily creates one module-level `db` singleton on first
  call and then ignores the env var — so if a future test file imports the
  router before setting this, it will touch the real `data/team.db` file
  instead.
- **Each test opens its own ephemeral HTTP server** via `app.listen(0)` and
  closes it in a `finally` block (see the `call()` helper), rather than
  sharing one server for the whole file.
