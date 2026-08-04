---
name: gotchas
description: Non-obvious server behavior — read before touching members.ts or db.ts
type: knowledge
scope:
  - server/**
updated: 2026-08-04 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
---

## Department validation is intentionally missing (TM-105)

`POST /api/members` (`server/src/routes/members.ts:26-46`) inserts whatever `department`
string the caller sends — no allow-list or validation. `server/src/routes/members.test.ts:70-85`
has a test, `POST /api/members rejects an invalid department with 400`, that is **deliberately
red on main** until TM-105 (department validation) lands. Do not "fix" this by deleting or
loosening the test — the fix belongs in production code (add department validation to the
POST handler), not the test.

## `is_active` is schema-only — DELETE is a hard delete

The `members` table has an `is_active` column and `GET /api/members` filters on
`is_active = 1` (`members.ts:18-24`), which reads like soft-delete support. But no route ever
sets `is_active = 0` — `DELETE /api/members/:id` (`members.ts:106-117`) issues a real
`DELETE FROM members WHERE id = ?`, permanently removing the row. `PATCH` also can't set
`is_active` (see below). If soft-delete is ever wanted, the column is there but the wiring
isn't.

## CSV export does not escape special characters

`GET /api/members/export` (`members.ts:48-58`) builds CSV rows with a plain template
literal (`` `${r.id},${r.name},...` ``) — no quoting or escaping. A `name` or `role`
containing a comma, quote, or newline will corrupt the CSV (columns shift or rows split).
This is unrelated to the SQL-injection rule in CLAUDE.md (queries are parameterized); it's
purely a string-building issue in the CSV serializer.

## PATCH only accepts four fields

`PATCH /api/members/:id` (`members.ts:83-104`) only reads `name`, `email`, `role`,
`department` from the body — `start_date` and `is_active` are not updatable via PATCH even
though they're real columns. Sending them is silently ignored (no error).
