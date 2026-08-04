---
name: gotchas
description: A CSV escaping bug — read before touching members.ts or its tests
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

## Department validation (TM-105) is now fixed

`server/src/routes/members.ts` now validates `department` against the
canonical code list in `server/src/departments.ts` on both `POST
/api/members` and `PATCH /api/members/:id`, returning 400 for unrecognized
codes. Seed data (`server/src/db.ts:37-44`) has been updated to use the
canonical codes (e.g. `ENGR` instead of both `'Engineering'` and `'Eng'`),
so `GET /api/members/stats` no longer double-counts department name
variants. There is no longer an intentional failing test for this — the
tests in `members.test.ts` now assert on the fixed behavior.

## CSV export doesn't escape field values

`GET /api/members/export` (`server/src/routes/members.ts`) builds CSV
rows with a plain template-literal join, no quoting/escaping of `,` or `"`
in `name`/`role`/`department`. A member name containing a comma would
silently corrupt the CSV column count. Neither CLAUDE.md nor README mention
this; it's derived purely from the code.
