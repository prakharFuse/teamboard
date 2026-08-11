---
name: gotchas
description: Undocumented rough edges — the open department-validation ticket, inconsistent seed data, hard delete, unescaped CSV export
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/db.ts
  - server/src/routes/members.ts
---

## Open ticket: department validation (TM-105) — CI is intentionally red

`server/src/routes/members.test.ts` has a test, `POST /api/members rejects an invalid department with 400`, that fails on `main` today. Its own comment explains this is deliberate: `POST /api/members` performs no department validation and accepts any string, returning `201`. `.github/workflows/ci.yml` runs this test on every PR, so any PR against this repo currently shows a real failing check until department validation is implemented (tracked as TM-105 in the test/CI comments — no ticket file in-repo, only these two comments). CLAUDE.md's "Rules" section does not mention this — treat the test file and CI comment as the source of truth for what "done" looks like here.

## Seed data already has inconsistent department names

`server/src/db.ts` seeds 8 members whose `department` values are: `Engineering`, `Product`, `Design`, `Eng`, `Marketing`, `Sales`, `Human Resources`, `Eng`. Two engineers (David Kim, Hiro Tanaka) are seeded under `'Eng'` while Alice Chen is seeded under `'Engineering'` — same team, two spellings. `GET /api/members/stats` groups `byDepartment` by raw string, so these currently show as two separate departments. Anything implementing TM-105's allow-list validation needs to either treat `Eng` as invalid seed data (and fix the seed) or include it in the allow-list — decide explicitly rather than picking whichever passes CI first.

## DELETE is a hard delete, not a soft delete

The `is_active` column and the `WHERE is_active = 1` filter in `GET /api/members` and `/stats` look like the delete path should set `is_active = 0`. It doesn't: `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) runs `DELETE FROM members WHERE id = ?` — a real row removal. `is_active` is written once at insert time (defaults to `1`) and never updated anywhere in the codebase. If a soft-delete/restore feature is ever requested, this is a behavior change to the DELETE route, not just adding a new PATCH field.

## CSV export doesn't escape fields

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds CSV rows with a template string (`` `${r.id},${r.name},...` ``) — no quoting or comma/quote escaping. A member `name` or `department` containing a comma (nothing prevents this — see above) will silently shift columns in the downloaded CSV. Not covered by any test.
