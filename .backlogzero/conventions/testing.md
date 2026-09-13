---
name: testing-conventions
description: How TeamBoard tests are written — no framework, in-memory SQLite, ephemeral HTTP server per call
type: convention
scope:
  - server/**
updated: 2026-09-13 (IONE-959)
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

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest,
  Vitest, or Mocha dependency exists in `package.json`. Follow this for new
  server tests rather than adding a test framework.
- Test files live next to the code they test (`server/src/routes/members.test.ts`
  beside `members.ts`), not in a separate `test/` or `__tests__` tree.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load time,
  before importing/calling any route handler, so `getDb()`'s first call
  opens an in-memory DB (see [[gotchas]] for why ordering matters).
- Each HTTP assertion in `members.test.ts` builds a fresh `express()` app,
  calls `app.listen(0)` for an OS-assigned port, does a real `fetch()`
  against `127.0.0.1`, then closes the server in a `finally` block — there's
  no supertest-style in-process request helper in use.
- `pnpm test` requires a build first (`pnpm build && node --test
  "dist/server/**/*.test.js"`) — tests run against compiled JS, not
  `ts-node`/`tsx`. There is currently no client-side test setup at all (no
  test file, runner, or script for `client/`).
- New tests must cover both a valid and an invalid case, matching the
  existing pattern of one "happy path" test (seeded members list) and one
  "rejection" test (invalid department, currently RED — see [[gotchas]]).
