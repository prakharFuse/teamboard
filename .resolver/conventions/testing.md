---
name: testing
description: How TeamBoard tests are written and run — no test framework, node:test only
type: convention
scope: global
updated: '2026-08-26'
captured_sha: 221c3c38dc1464695c6402832dc7657e83d6d2a0
sources:
  - server/src/routes/members.test.ts
  - package.json
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- No test framework dependency. Tests use Node's built-in `node:test` +
  `node:assert/strict`, colocated next to the source file they cover
  (`server/src/routes/members.test.ts` next to `members.ts`).
- `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"`
  (`package.json:16`) — tests run against the **compiled** output, not the
  TypeScript source directly, and only under `server/`; there is no client
  test setup.
- The established pattern for an HTTP-level test (see `members.test.ts`):
  build a bare `express()` app with just the router under test, `app.listen(0)`
  for an ephemeral port, `fetch` against it, and `server.close()` in a
  `finally`. Reuse the `call(method, path, body)` helper style rather than
  inventing a new one.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load time (top
  of the test file), before any request triggers `getDb()` — see [[gotchas]]
  for why this must happen before the first call.
- New route tests should cover both a valid-input and an invalid-input case
  per endpoint, not just the happy path — the existing suite already models
  this split (seeded-list case vs. invalid-department case).
