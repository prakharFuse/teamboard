---
name: testing
description: How TeamBoard server tests are structured — read before adding or editing server/src/routes/*.test.ts
type: convention
scope:
  - server/src/**
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

No test framework dependency (no Jest/Vitest/Mocha) — tests use Node's built-in `node:test` + `node:assert/strict` only, per `server/src/routes/members.test.ts:16-17`.

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before any route handler runs — `getDb()` (`server/src/db.ts:11`) is a lazy singleton read once, so the env var must land before the first request in the file.
- Build a fresh `express()` app per test file with just the router under test mounted (`makeApp()` in the test file), then `app.listen(0)` per call to get an OS-assigned port, and `server.close()` in a `finally` — see the `call()` helper.
- `pnpm test` runs `pnpm build && node --test "dist/server/**/*.test.js"` — tests run against **compiled output**, not source directly. A test edit requires a rebuild to take effect when run via `pnpm test`; `pnpm typecheck` alone does not recompile `dist/`.
- All members currently share one in-memory DB across tests in the same file (module-level `const app = makeApp()`), so tests are not isolated from each other's writes within a file — order and side effects matter if you add tests that mutate data (e.g. a POST test running before a GET-count test will change the expected count).
