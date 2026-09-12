---
name: gotchas
description: Known-red CI test and other traps to check before touching members.ts or its tests
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## The department-validation test is intentionally RED

`server/src/routes/members.test.ts:70` (`POST /api/members rejects an invalid department with 400`) fails on `main` today by design. `POST /api/members` (`server/src/routes/members.ts:26`) accepts any string for `department` and always returns `201`. This is tracked as TM-105 and is called out explicitly in both the test file's header comment and `.github/workflows/ci.yml`. Don't "fix" this by loosening or deleting the test — the task is to add department validation to the route so the existing assertion passes.

There's no enum/allowlist of valid departments anywhere in the code yet (seed data in `server/src/db.ts` uses free-text department names, including inconsistent ones like `'Eng'` vs `'Engineering'`) — a validation fix needs to define the accepted set itself, not infer it from seed data.

## Other things that look validated but aren't

- `PATCH /api/members/:id` (`server/src/routes/members.ts:83`) accepts `email` with no uniqueness or format check — unlike `POST`, it won't surface the `UNIQUE` constraint as a friendly 409; a duplicate email here throws unhandled.
- No route validates `email` format or `start_date` format on either `POST` or `PATCH`.
