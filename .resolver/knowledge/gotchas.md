---
name: gotchas
description: Known intentional red test, seed-data inconsistency, and a CSV escaping bug — read before touching members.ts or its tests
type: knowledge
scope: global
updated: '2026-08-04'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
---

## `POST /api/members` has no department validation (intentional RED test)

`server/src/routes/members.test.ts:70-85` asserts that posting an invalid
`department` string returns 400. It currently fails on `main` because
`members.ts` (`server/src/routes/members.ts:26-46`) inserts whatever
`department` string the caller sends, with no whitelist or `CHECK`
constraint. This is deliberate — the test/comment block references ticket
**TM-105** and the CI workflow comment (`.github/workflows/ci.yml:3-7`)
confirms it's meant to give PRs a real failing check to fix, not a
regression to chase. If you're asked to add department validation, this is
the test that should flip green; don't "fix" it by loosening the assertion.

## Seed data already has an inconsistent department name

`server/src/db.ts:40,44` seeds two rows with `department: 'Eng'` alongside
other rows using `'Engineering'` (`server/src/db.ts:37`). Any department
whitelist added to satisfy the TM-105 test must account for both spellings
already present in seed data, or reconcile them — otherwise `GET
/api/members/stats` (`server/src/routes/members.ts:60-69`) will keep
reporting `Eng` and `Engineering` as separate departments.

## CSV export doesn't escape field values

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds CSV
rows with a plain template-literal join, no quoting/escaping of `,` or `"`
in `name`/`role`/`department`. A member name containing a comma would
silently corrupt the CSV column count. Neither CLAUDE.md nor README mention
this; it's derived purely from the code.
