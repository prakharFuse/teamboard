---
name: testing
description: How tests are written and run in this repo — no test framework dependency
type: convention
scope: global
updated: '2026-09-01'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

- Tests use Node's **built-in** `node:test` + `node:assert/strict` —
  there's no Jest/Vitest/Mocha dependency in `package.json`. Add new tests
  the same way (`import { test, before } from 'node:test'`), don't introduce
  a new test framework for a single suite.
- `pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` —
  tests run against **compiled JS**, not `ts-node`/`tsx` directly. A new
  `*.test.ts` file under `server/src/` needs no separate config, but a typo
  that only TypeScript would catch won't fail `node --test` until `pnpm
  build` is also run first (which `pnpm test` does automatically).
- Route tests spin up a real, ephemeral Express app (`makeApp()`) on an
  OS-assigned port (`app.listen(0)`) per request, and hit it over real
  `fetch()` — not `supertest` or handler-level unit calls. Follow this
  pattern for new route tests rather than importing handlers directly.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before
  any `getDb()` call, to keep tests off the real `data/team.db` file — see
  [[gotchas]] for why the ordering matters.
- There is no client-side test setup (no test file under `client/`) — don't
  assume a client test runner is configured.
