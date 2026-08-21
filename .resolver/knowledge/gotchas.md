---
name: gotchas
description: Non-obvious traps — intentionally-red CI test, no department validation, hard deletes
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

**CI is intentionally red on `main` right now.** `server/src/routes/members.test.ts`
has a test, `POST /api/members rejects an invalid department with 400`, that
fails against current `main` because `POST /api/members`
(`server/src/routes/members.ts`) inserts whatever `department` string it's
given with no validation. This is deliberate (see the test file's header
comment, tracked as TM-105) so a PR against this repo produces a real failing
CI check. Don't treat this failure as something *your* change broke unless you
touched department handling — check whether it was already failing on `main`.

**No canonical department list exists anywhere in code.** There's no enum,
`CHECK` constraint, or config listing valid departments — `department` is a
bare `TEXT` column (see [[data-model]]). The seed data in `server/src/db.ts`
even uses inconsistent values for the same team (`'Engineering'` for Alice,
`'Eng'` for David and Hiro). Anyone implementing TM-105's validation has to
decide/derive the valid set — it isn't discoverable from existing code, and
the seed data can't be trusted as the source of truth.

**`is_active` is never set to 0 anywhere.** The column defaults to `1` on
insert and `GET /`, `/stats` filter on `is_active = 1`, but
`DELETE /api/members/:id` does a real `DELETE FROM members` — it does not
soft-delete by flipping the flag. There is no code path that deactivates a
member without removing their row. Don't assume "remove" is reversible or
that `is_active = 0` rows exist to query.

**`PATCH /api/members/:id` has the same missing-validation gap as `POST`** — it
writes `department` straight through via `COALESCE`, with no checks. Any
department-validation fix for TM-105 needs to cover both routes.
