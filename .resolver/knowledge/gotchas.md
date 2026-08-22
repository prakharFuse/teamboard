---
name: gotchas
description: Known-broken or intentionally-red behaviors in members.ts (missing department validation, CSV escaping) — read before editing the members API
type: knowledge
scope:
  - server/src/routes/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
---

## Department validation is missing — this is the CI-red ticket (TM-105)

`POST /api/members` (`server/src/routes/members.ts:26-46`) and `PATCH /api/members/:id` (`server/src/routes/members.ts:83-104`) accept any string for `department` — there's no allow-list check. `server/src/routes/members.test.ts:70-85` asserts `POST` with `department: 'NotARealDepartment'` returns `400`; it currently gets `201`, so that test is intentionally RED on `main` per `.github/workflows/ci.yml`'s comment. `../../CLAUDE.md` doesn't mention this gap at all — implementing TM-105 means adding a department allow-list to both `POST` and (for consistency) `PATCH`, and must account for the `'Eng'` vs `'Engineering'` inconsistency already in seed data (see `data-model.md`).

## CSV export doesn't escape delimiters or quotes

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds CSV rows with a plain template-literal join: `` `${r.id},${r.name},${r.email},...` ``. A `name` or `role` containing a comma, quote, or newline will silently corrupt the exported file (columns shift) — there's no quoting/escaping logic. No current seed data triggers this, but any `POST` with a comma in `name` will produce a broken HR export row.

## `PATCH` silently ignores `start_date` and `is_active`

`PATCH /api/members/:id` only reads `name`, `email`, `role`, `department` from the body (`server/src/routes/members.ts:92`) — a request body with `start_date` is accepted (200) but silently has no effect. `../../CLAUDE.md`'s endpoint table just says "update member fields" without listing which ones, so this isn't a contradiction, just an undocumented gap worth knowing before extending the PATCH handler.
