---
name: gotchas
description: Non-obvious gaps and traps in the members API found by reading the code — check before editing routes or CI
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
---

## CI is intentionally red on `main` right now
`server/src/routes/members.test.ts` has a test, "POST /api/members rejects an invalid department with 400", that fails on the current code: `POST /api/members` (`server/src/routes/members.ts:26`) inserts whatever `department` string is sent, with no validation against a known list. Both the test file and `.github/workflows/ci.yml` have comments explaining this is deliberate — it's a planted failing check for ticket TM-105 (add department validation). Don't treat this failure as an unrelated flake or try to make it pass by loosening the assertion; the fix is to add real validation to the POST handler.

## PATCH doesn't update every field POST accepts
`POST /api/members` requires `name, email, role, department, start_date`. `PATCH /api/members/:id` (`server/src/routes/members.ts:83`) only accepts and updates `name, email, role, department` — `start_date` and `is_active` are not settable via PATCH at all. Neither CLAUDE.md nor README.md mention this asymmetry.

## `is_active` looks like soft-delete but isn't wired up
See [[data-model]] — `DELETE /api/members/:id` hard-deletes the row instead of flipping `is_active`. If a task asks for a "restore member" or "deactivate" feature, the column exists but no code path sets it to 0; this would need to be added, not just exposed.

## CSV export has no field escaping
`GET /api/members/export` (`server/src/routes/members.ts:48`) builds CSV rows with a plain template-literal join: `` `${r.id},${r.name},${r.email},...` ``. A `name` or `department` value containing a comma, quote, or newline will corrupt the CSV structure (columns shift) rather than being quoted/escaped. This is the kind of thing that will only surface once real data has a comma in it, so it won't show up in the seed data or existing tests.

## Route ordering matters
`GET /export` and `GET /stats` (`server/src/routes/members.ts:48,60`) are registered before the parameterized `GET /:id` (`server/src/routes/members.ts:71`). This ordering is required — Express matches routes in registration order, so if a new static route (e.g. `GET /some-new-route`) is added, it must be registered above `GET /:id` or it will be shadowed and treated as `:id = "some-new-route"`.
