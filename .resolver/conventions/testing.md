---
name: testing
description: TeamBoard test conventions — read before touching server/src/routes/members.test.ts or CI
type: convention
scope:
  - server/**
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

Tests use Node's built-in test runner (`node --test`) against the compiled output — no Jest/Vitest/Mocha. `pnpm test` builds first, then runs `dist/server/**/*.test.js` (package.json:16). Tests spin up a real in-process Express app on an ephemeral port with `TEAMBOARD_DB_PATH=':memory:'` (members.test.ts:24) rather than mocking `getDb()`.

**One test is intentionally red on `main`:** "POST /api/members rejects an invalid department with 400" (members.test.ts:70-85) fails today because there's no department allow-list (see [[overview]]). This is deliberate — it's the tracked gap for TM-105 and gives CI a real failing check. Don't "fix" it by loosening the assertion; fix it by adding department validation to `POST /api/members`, or leave it red if the task is unrelated.
