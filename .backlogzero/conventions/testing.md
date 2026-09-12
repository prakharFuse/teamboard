---
name: testing
description: How tests are structured, run, and the one intentionally-failing test (TM-105) — read before touching members.test.ts or CI
type: convention
scope:
  - server/**
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - package.json
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

No test framework dependency: tests use Node's built-in `node:test` + `node:assert/strict`, spinning up an in-process Express app on an ephemeral port (`server/src/routes/members.test.ts:26-53`). Follow this pattern for new route tests — no Jest/Vitest/Supertest in this repo.

Tests run against **compiled output**: `pnpm test` = `pnpm build && node --test dist/server/**/*.test.js` (`package.json:16`). Source-only edits need a rebuild to take effect when invoking `node --test` directly.

Isolation: set `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before** any `getDb()` call (top of the test file, before the first request) — `getDb()` memoizes a module-level singleton on first call, so setting the env var later has no effect.

## The intentional RED test (TM-105)

`members.test.ts:70-85` (`POST /api/members rejects an invalid department with 400`) is **deliberately failing on `main`** — `POST /api/members` in `server/src/routes/members.ts:26-46` performs no department validation and accepts any string, returning 201. The test and the CI workflow comment (`.github/workflows/ci.yml:3-7`) both document this as intentional: it exists to give PRs a real, readable failing CI check until department validation ships (ticket TM-105).

Do not "fix" this by weakening the test or adding a skip — the fix is implementing department validation in `members.ts`. If asked to work on TM-105, this test is the acceptance check; making it pass without adding real validation logic (e.g. hardcoding a pass) defeats its purpose.
