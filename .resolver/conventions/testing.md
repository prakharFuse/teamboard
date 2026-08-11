---
name: testing-conventions
description: How tests are structured in this repo — no test framework, in-memory SQLite, one file per route module
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

- No test framework dependency (no Jest/Vitest/Mocha). Tests use Node's built-in `node:test` + `node:assert/strict`, matched by `pnpm test`'s glob `dist/server/**/*.test.js` — so tests are TypeScript source (`*.test.ts`) that get compiled by `pnpm build` before `node --test` runs on the `dist/` output. There's no standalone "run tests without building" script.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before any handler calls `getDb()` (`getDb()` is a lazy singleton — the env var must be set before the first call or the test hits the real `data/team.db`). See `members.test.ts:24`.
- Spin up a real Express app + real HTTP listener per request (`app.listen(0)`, read the ephemeral port, `fetch()`, then `server.close()` in `finally`) rather than importing route handlers directly. Follow this pattern (`call()` helper in `members.test.ts:35-53`) for new route tests instead of introducing `supertest` or similar.
- One `*.test.ts` file per route module, colocated next to the module it tests (`server/src/routes/members.test.ts` next to `members.ts`) — no separate `test/` or `__tests__/` directory.
- A currently-failing test is not automatically a bug to silence: `members.test.ts` intentionally keeps a red test for unimplemented department validation (see [[gotchas]]). Don't delete or loosen that assertion to make CI green — the fix is to implement the validation.
