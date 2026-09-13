---
name: gotchas
description: Non-obvious behaviors and traps in TeamBoard's API — read before touching routes/members.ts
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## The department-validation test is intentionally RED on `main`

`server/src/routes/members.test.ts` contains a test,
`'POST /api/members rejects an invalid department with 400'`, that fails on
`main` by design. The test file's own header comment and
`.github/workflows/ci.yml`'s comments both spell this out: `POST
/api/members` currently accepts any `department` string and returns 201 —
there is no allow-list or enum check in `routes/members.ts`. The failing
check is a deliberate planted `pr_check` fixture (tracked as TM-105) so CI
has a real failing run to fix. Do not "fix" this by deleting or loosening the
test — the correct fix is adding department validation to `POST
/api/members` (and deciding what the valid department set is).

## `DELETE /api/members/:id` hard-deletes, despite the `is_active` column

The schema has an `is_active` flag (`server/src/db.ts`) and `GET
/api/members` / `GET /api/members/stats` both filter on it, which reads like
a soft-delete design. But `router.delete` in `routes/members.ts` runs `DELETE
FROM members WHERE id = ?` — a real row delete — and no route ever sets
`is_active = 0`. If you add "restore" or "deactivate" functionality, treat
`is_active` as currently unused/dead rather than assuming existing rows get
soft-deleted.

## `PATCH /api/members/:id` can't change `start_date` or `is_active`

The handler destructures only `name, email, role, department` from
`req.body`; `start_date` and `is_active` are not accepted, so there is no way
via the current API to correct a member's start date after creation.

## Tests require a build first

`pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` — it
runs against **compiled** output in `dist/`, not `ts-node` or an in-source
runner. Editing `server/src/routes/members.test.ts` and running `node --test`
directly on the `.ts` file will not pick up the change; you must rebuild (or
run the full `pnpm test` script).

## Tests select the DB via an env var, not a mock

`TEAMBOARD_DB_PATH=':memory:'` (set at the top of `members.test.ts`) is what
keeps tests off the real `data/team.db` file — `db.ts` checks this env var
before deciding whether to `mkdir`/open a real file. If you add new test
files that import `db.ts` before this env var is set, they'll touch the real
dev database.
