---
name: gotchas
description: Non-obvious behavior in TeamBoard's server — department validation status, CSV export, seed-data quirks
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
---

## Department validation is deliberately unimplemented (TM-105)

`POST /api/members` and `PATCH /api/members/:id` accept any string for `department` — there is no whitelist, enum, or DB constraint (confirmed in `members.ts:26-46` and `members.ts:83-104`, and in the schema in [[data-model]]).

`server/src/routes/members.test.ts` has a test, `'POST /api/members rejects an invalid department with 400'`, that asserts a 400 for an unrecognized department. It fails today by design — the test file and `.github/workflows/ci.yml` both say this is intentional, to give CI a real red check tracked as **TM-105**. If asked to add department validation, this is the ticket being resolved; the fix should introduce an actual whitelist (none exists yet — the seed data below is not a reliable source of the "valid" list) and make this test pass, not just skip/delete it.

## Seed data has an inconsistent department naming already

`getDb()`'s seed rows use two different spellings for the same department: `'Engineering'` (Alice Chen) vs `'Eng'` (David Kim, Hiro Tanaka) — `server/src/db.ts:37-44`. `GET /api/members/stats` groups by exact string match (`GROUP BY department`), so today's seeded stats show *two* separate Engineering buckets instead of one. Any department-validation fix should also decide whether to normalize this existing data, since a strict whitelist would otherwise still let both spellings coexist as "valid" distinct values unless they're unified first.

## CSV export does not escape fields

`GET /api/members/export` (`members.ts:48-58`) builds CSV by naive string interpolation: `` `${r.id},${r.name},${r.email},...` ``. A `name` or `role` containing a comma, quote, or newline will corrupt the CSV row or shift columns — there is no quoting/escaping. This is a real gap, not just a style nit, since the export is described in README/CLAUDE.md as "HR integration."

## DB singleton and test isolation

`getDb()` caches its `DatabaseSync` handle in a module-level `let db` — the first call wins. `members.test.ts` sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load time, *before* any route handler runs, specifically because `getDb()` is called lazily inside each handler; setting the env var later (e.g. inside a `before()` hook after a request already fired) would be too late. See [[testing]] for the full pattern.
