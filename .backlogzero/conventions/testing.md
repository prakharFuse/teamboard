---
name: testing
description: How TeamBoard's tests are structured and run — read before adding or modifying a *.test.ts file
type: convention
scope:
  - server/**
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- **No test framework dependency.** Tests use Node's built-in `node:test` + `node:assert/strict` (see `server/src/routes/members.test.ts:16-17`). Don't add Jest/Vitest/Mocha for new tests — follow the existing pattern.
- **Tests run against compiled output, not source.** `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` — it type-checks/compiles via `tsc` first, then runs the `.js` output. A test-only syntax error or type error fails at the build step, before any assertion runs.
- **Isolation via `TEAMBOARD_DB_PATH=':memory:'`**, set at module load time before the first `getDb()` call (`getDb()` is a lazy singleton — see `[[data-model]]`). Any new test file that touches `getDb()` must set this env var before importing/calling anything that triggers it, or it will write to the real `data/team.db`.
- **No mocking layer** — tests spin up a real `express()` app with the router mounted, `.listen(0)` for an ephemeral port, and make real `fetch()` calls against it (`server/src/routes/members.test.ts:26-53`), closing the server in a `finally` block after each call.
- Co-locate test files next to the module under test (`routes/members.ts` → `routes/members.test.ts`), not in a separate `test/` tree.
