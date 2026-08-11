---
name: gotchas
description: Known sharp edges in the members API not obvious from CLAUDE.md/README — read before touching members.ts
type: knowledge
scope:
  - server/src/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/db.ts
---

## TM-105: department validation is intentionally missing, and CI is red on `main`

`POST /api/members` (`server/src/routes/members.ts:26-46`) checks that `department` is present but not that it's a real department — any string is accepted and inserted as-is. `members.test.ts` has a test, "rejects an invalid department with 400", that is *deliberately failing on main* against this exact gap (tracked as TM-105 in the test's own comment). `.github/workflows/ci.yml` runs this test on every PR, so any PR touching this repo will show a real red check until department validation ships. Don't "fix" this by deleting or loosening the test — the ticket is to add the validation in `members.ts`.

## PATCH only updates four fields

`PATCH /api/members/:id` (`server/src/routes/members.ts:83-104`) only accepts `name`, `email`, `role`, `department` from the request body. `start_date` and `is_active` are silently ignored — there is no way via the API today to correct a start date or reactivate a member. CLAUDE.md's endpoint table just says "update member fields," which reads as more general than the implementation.

## DELETE is a hard delete, not a soft delete

See [[data-model]] — despite the `is_active` column, `DELETE /api/members/:id` permanently removes the row. There's no undo and no archive.

## CSV export doesn't escape fields

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds CSV rows with a template literal (`` `${r.id},${r.name},...` ``) — no quoting/escaping. A member `name` or `role` containing a comma, quote, or newline will corrupt the CSV (and a leading `=`/`+`/`-`/`@` in a field is a classic CSV-injection vector into whatever spreadsheet tool HR opens the export in). This isn't a SQL-injection risk (the SQL itself is parameterized, matching CLAUDE.md's rule), but it is a real bug if any of these fields ever go through untrusted input.

## Static routes must stay above `/:id`

`members.ts` deliberately declares `/export` and `/stats` (`:48`, `:60`) before the generic `/:id` handler (`:71`). Express matches routes in registration order, so a new static-path route (e.g. `/search`) added *after* `/:id` would instead be captured by `GET /:id` with `id = "search"`, fail `Number(req.params.id)` silently (`NaN`), and 404. Add new fixed-path GET routes above `/:id`, not below.
