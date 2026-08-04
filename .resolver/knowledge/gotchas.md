---
name: gotchas
description: A CSV escaping bug — read before touching members.ts or its tests
type: knowledge
scope: global
updated: 2026-08-04 (IONE-959)
captured_sha: dc1c6d00c4ad164af8b2ce092b436be8cf8e726a
sources:
  - client/src/departments.ts
  - server/src/departments.ts
  - client/src/App.tsx
  - package.json
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

## Department code list is duplicated, not shared

`client/src/departments.ts` and `server/src/departments.ts` each define
their own copy of the `DEPARTMENTS` map and `deptName()`. There's no shared
package/workspace (single root `package.json`, no `workspaces`), so the two
files are kept in sync by hand — the client file's header comment says as
much. Adding/renaming a department code requires editing both files; the
client only uses its copy for the add-member `<select>` and for rendering
`deptName()` badges, it does not fetch the code list from the server.

## CSV export doesn't escape field values

`GET /api/members/export` (`server/src/routes/members.ts`) builds CSV
rows with a plain template-literal join, no quoting/escaping of `,` or `"`
in `name`/`role`/`department`. A member name containing a comma would
silently corrupt the CSV column count. Neither CLAUDE.md nor README mention
this; it's derived purely from the code.
