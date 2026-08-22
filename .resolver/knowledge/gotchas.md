---
name: gotchas
description: Known-red CI test (TM-105 department validation) and other traps before touching members.ts
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## TM-105: department validation is missing, and CI is red on main because of it

`server/src/routes/members.test.ts` has a test, `POST /api/members rejects an invalid department with 400`, that is failing on `main` right now. `POST /api/members` (server/src/routes/members.ts:26-46) inserts whatever `department` string is sent — there is no allow-list or enum anywhere in the code. Neither CLAUDE.md nor README.md mention this; it's only documented in the test file's own comments and the CI workflow comment.

- This is intentional (per the test/CI comments), kept red on purpose as a real failing check for CI-fixing workflows.
- If asked to "fix CI" or "make tests pass" on this repo, adding department validation to `POST /api/members` (and deciding the allow-list) is almost certainly the task — check with the user before inventing department names.
- `PATCH /api/members/:id` has no such validation either, and CLAUDE.md doesn't call this out — if TM-105 is resolved for POST, PATCH is a likely follow-up gap.

## Hard delete despite `is_active` column

See ../data-model.md — `DELETE /api/members/:id` removes rows permanently; `is_active` is dead weight, not a soft-delete flag.
