---
name: known-issues
description: Read before "fixing" a red pnpm test or a members.ts route — some gaps are intentional, some are just gaps
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## Intentional: no department validation (TM-105)

`POST /api/members` (`server/src/routes/members.ts:26`) inserts whatever `department` string the caller sends — no allow-list, no validation. `server/src/routes/members.test.ts:70` asserts this should 400 for `department: 'NotARealDepartment'`, and is documented in both the test file and `.github/workflows/ci.yml` as intentionally RED on `main` until TM-105 lands. Don't treat this specific failure as an unrelated regression; do treat it as the one production-code gap this repo is actually waiting on.

## Not intentional, not covered by any test

- **PATCH email collisions are unhandled.** `PATCH /api/members/:id` (`server/src/routes/members.ts:83`) runs an `UPDATE ... SET email = COALESCE(?, email)` with no try/catch around the `UNIQUE` constraint, unlike the POST handler which explicitly catches it and returns `409`. A PATCH to an existing email will throw synchronously inside the route handler.
- **CSV export doesn't escape fields.** `GET /api/members/export` (`server/src/routes/members.ts:48`) builds CSV via template-literal joins with no quoting/escaping. A `name` or `department` containing a comma, quote, or newline will corrupt the CSV row.
- **Route order is load-bearing.** `/export` and `/stats` (`members.ts:48`, `:60`) are registered before the generic `/:id` (`members.ts:71`) specifically so they aren't swallowed as an `id` param. Any new static sub-path under `/api/members/*` must be added above `/:id`, not below it.
