---
name: testing
description: How tests are wired (compiled output, in-memory DB, no framework) — read before adding or running tests
type: convention
scope:
  - server/src/**
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/routes/members.test.ts
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

`pnpm test` (see `../../CLAUDE.md`) runs `pnpm build` first, then
`node --test "dist/server/**/*.test.js"` — tests execute against the
**compiled** JS in `dist/`, not `.ts` sources directly. A stale `dist/` from a
partial build can make `pnpm test` pass or fail against old code; when in
doubt, `pnpm build` before trusting a local test run.

- No test framework dependency — tests use Node's built-in `node:test` +
  `node:assert/strict`, spun up as an ephemeral in-process Express server on a
  random port (`server.listen(0)`), talking over real `fetch()` calls.
- Isolation is via `process.env.TEAMBOARD_DB_PATH = ':memory:'` set at
  **module load time**, before any route handler runs — `getDb()` is a lazy
  singleton (`db.ts`), so this only works because it's set before the first
  request. New test files must do the same before importing/using the router.
- See [[gotchas]] for the intentionally-failing department-validation test
  (TM-105) that this test file also contains.
