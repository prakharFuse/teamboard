---
name: testing
description: How tests are written and run in TeamBoard — read before adding or modifying tests
type: convention
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- No test framework dependency (no Jest/Vitest/Mocha in `package.json`). Tests use
  Node's built-in `node:test` + `node:assert/strict`
  (`server/src/routes/members.test.ts:16-17`).
- `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"`
  (`package.json:16`) — tests run against the **compiled** output, not source directly.
  A `.test.ts` file added under `server/src/` only gets picked up once
  `server/tsconfig.build.json` includes it (it extends `server/tsconfig.json`, whose
  `include` is `src/**/*`, so any new `*.test.ts` under `server/src/` is picked up
  automatically).
- Isolate the DB per test file by setting `process.env.TEAMBOARD_DB_PATH = ':memory:'`
  at module load time, before any route handler runs — `getDb()` is a lazy singleton,
  so the env var must be set before the first request, not before each test
  (`members.test.ts:24`, see `[[data-model]]`/`[[architecture]]`).
- Each test spins up its own ephemeral Express app on an OS-assigned port
  (`app.listen(0)`), exercises it over real HTTP via `fetch`, and closes the server in
  a `finally` block (`members.test.ts:26-53`) — no supertest/request-mocking library.
- There is currently one intentionally-failing test on `main`:
  `POST /api/members rejects an invalid department with 400`
  (`members.test.ts:70-85`). It documents a real gap — `POST /api/members` performs no
  department allow-list validation — and CI (`.github/workflows/ci.yml`) is expected to
  show this as a red check until that validation is added. Don't "fix" this test by
  loosening its assertion; the fix belongs in `server/src/routes/members.ts`'s POST
  handler.
