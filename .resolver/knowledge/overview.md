---
name: overview
description: What TeamBoard is, its stack, and the state of the open TM-105 department-validation work
type: knowledge
scope: global
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - server/src/db.ts
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

For stack, API surface, and project layout, see ../../README.md — it's accurate.

## TM-105: department validation is not implemented

`department` is a free-text `TEXT NOT NULL` column (server/src/db.ts:24) with no
enum, allow-list, or lookup table anywhere in the codebase. `POST /api/members`
and `PATCH /api/members/:id` (server/src/routes/members.ts) accept whatever
string the caller sends and persist it as-is — no validation logic exists to
extend, only to add.

The failing test `POST /api/members rejects an invalid department with 400` in
server/src/routes/members.test.ts is the executable spec for this: it currently
gets 201 back for a department of `'NotARealDepartment'` and expects 400. The
CI workflow (.github/workflows/ci.yml) runs this test on every PR and treats
the red result as expected until TM-105 lands — this is a deliberately-planted
failing check, not a flake.

## Derived gotcha: seed data already disagrees on department names

The seed rows in server/src/db.ts use two different spellings for the same
department: David Kim and Hiro Tanaka are seeded with `department: 'Eng'`
while Alice Chen is seeded with `department: 'Engineering'` (server/src/db.ts:37-44).
Because there's no validation today, `GET /api/members/stats` reports these as
two separate departments. Any fix for TM-105 that introduces a strict allow-list
must also decide whether `'Eng'` is valid or whether the seed data needs
correcting — otherwise the fix will break the existing seeded rows or the stats
endpoint's grouping.
