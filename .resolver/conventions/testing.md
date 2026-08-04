---
name: testing
description: How server tests are structured and run against node:sqlite — read before adding or modifying tests
type: convention
scope:
  - server/**
updated: '2026-08-04'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/routes/members.test.ts
  - package.json
  - server/tsconfig.build.json
---

- No test framework dependency — tests use Node's built-in `node:test` +
  `node:assert/strict` (`server/src/routes/members.test.ts:16-17`). Don't add
  Jest/Vitest/Mocha for server tests; follow the existing pattern.
- Tests live next to the code they cover as `*.test.ts` (e.g.
  `server/src/routes/members.test.ts` beside `members.ts`), not in a separate
  `test/` directory.
- `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"`
  (`package.json:16`) — tests run against **compiled output**, not
  `ts-node`/`tsx`. `server/tsconfig.build.json` extends the main tsconfig and
  is included by the same `src/**/*` glob, so `.test.ts` files compile into
  `dist/server` alongside production code.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module scope, before
  any request is made — `getDb()` is a lazy singleton that reads this env var
  only on its first call (`server/src/db.ts:7-16`). Setting it later, or
  inside a `before()` hook that runs after some other import already
  triggered `getDb()`, gives you the on-disk `data/team.db` instead of an
  isolated DB.
- Tests spin up a real Express server on an ephemeral port (`app.listen(0)`)
  and hit it with `fetch`, rather than importing route handlers directly —
  follow this pattern (see the `call()` helper in `members.test.ts:35-53`)
  for new endpoint tests so status codes and JSON parsing are exercised
  end-to-end.
