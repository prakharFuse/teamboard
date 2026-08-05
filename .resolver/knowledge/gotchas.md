---
name: gotchas
description: Known-red test, seed-data inconsistency, and other code-verified behavior to know before editing members.ts
type: knowledge
scope: global
updated: '2026-08-05'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
---

- **TM-105 is an open, intentional CI failure.** `server/src/routes/members.test.ts`
  ("POST /api/members rejects an invalid department with 400") is RED on `main`:
  `router.post('/')` in `members.ts:26` only checks that `department` is
  non-empty, it never checks it against an allow-list, so any string is accepted
  and a 201 is returned. `.github/workflows/ci.yml` calls this out by name and
  expects a PR to turn this check green by adding department validation — don't
  "fix" the test by loosening its assertion, fix `members.ts`.

- **Seed data has inconsistent department strings.** `db.ts:40,44` seed "David
  Kim" and "Hiro Tanaka" with `department = 'Eng'` while Alice Chen uses
  `'Engineering'` (`db.ts:37`). `GET /api/members/stats` (`members.ts:60`) groups
  by the raw `department` column, so on a fresh DB the stats response shows
  `Engineering` and `Eng` as two separate buckets instead of one — this is a
  preexisting data issue, not a query bug, and any department allow-list added
  for TM-105 should reconcile these two seed values to one canonical name.

- **CSV export doesn't escape values.** `GET /api/members/export`
  (`members.ts:48`) builds each row with a template literal and `.join(',')`
  with no quoting — a `name`, `role`, or `department` containing a comma or
  newline will silently corrupt the downloaded CSV (columns shift, HR import
  breaks) rather than erroring.

- **DELETE is a hard delete, not a soft delete.** `DELETE /api/members/:id`
  (`members.ts:106`) runs `DELETE FROM members WHERE id = ?`. `GET /api/members`
  filters on `is_active = 1`, implying a soft-delete model, but no route ever
  sets `is_active` to 0 — `PATCH /api/members/:id` (`members.ts:83`) only
  updates `name`/`email`/`role`/`department`. If soft-delete is the intent,
  both the DELETE handler and PATCH's allowed fields need to change together.

- **PATCH silently drops unsupported fields.** Sending `start_date` or
  `is_active` in a `PATCH /api/members/:id` body is not an error — `members.ts:92`
  destructures only `name, email, role, department` from `req.body`, so any
  other field is ignored with no 400 and no warning.
