---
name: testing
description: How TeamBoard's server tests are written — runner, DB isolation, and the one intentionally-red test
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
  - .github/workflows/ci.yml
---

- Tests use Node's built-in test runner (`node:test` + `node:assert/strict`) — no Jest/Mocha/Vitest dependency for the server. `pnpm test` runs `pnpm build` then `node --test "dist/server/**/*.test.js"` (`package.json:16`), so tests are compiled like any other server file (test files live under `server/src/**` and match `*.test.ts`, e.g. `server/src/routes/members.test.ts`).
- Test isolation is via `process.env.TEAMBOARD_DB_PATH = ':memory:'` set at module load, before any route handler calls `getDb()` — `getDb()` is a lazy singleton, so the env var must be set before the first request in a test file (`server/src/routes/members.test.ts:24`).
- Each test spins up its own ephemeral Express server on an OS-assigned port (`app.listen(0)`) and closes it in a `finally` block; there's no shared test server across test files.
- `server/src/routes/members.test.ts` contains one test that is **intentionally failing on `main`**: `POST /api/members rejects an invalid department with 400` (tracked as TM-105 — see [[overview]]). CI (`.github/workflows/ci.yml`) runs this on every PR by design, to give the Fix-CI/Refine-PR flow a real red check. Don't treat this failure as a pre-existing flake to skip or delete — resolving it means adding department validation to `server/src/routes/members.ts`, not adjusting the test.
