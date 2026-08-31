---
name: gotchas
description: Non-obvious runtime behaviors in the members API worth checking before changing routes or the schema
type: knowledge
scope:
  - server/**
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## `DELETE` hard-deletes; `is_active` is never toggled

The `members` table has an `is_active` column and `GET /api/members` filters
on `is_active = 1` (server/src/routes/members.ts:21), which reads like a
soft-delete design. But `DELETE /api/members/:id` runs
`DELETE FROM members WHERE id = ?` (members.ts:115) — a real row delete.
Nothing in the codebase ever sets `is_active` to 0. In practice every row is
always active; the filter in the list query is currently a no-op.

## Route order matters: `/:id` is declared last

`GET /export` and `GET /stats` are defined before `GET /:id`
(members.ts:48, 60, 71). If a new static route is added below `/:id` it will
never be reached — Express matches `/:id` first and treats the static segment
as an id param.

## `GET /api/members/export` doesn't escape CSV fields

The CSV builder (members.ts:52-54) joins raw column values with commas and
`\n` with no quoting/escaping. A `name` or `department` containing a comma or
newline will produce a malformed CSV row (columns shift, or an HR import
breaks). This applies to any of the existing free-text fields, not just
`department` — worth checking if you touch this endpoint.

## `PATCH` silently ignores `start_date` and `is_active`

The `PATCH /api/members/:id` handler destructures only `name, email, role,
department` (members.ts:92) — a request body containing `start_date` is
accepted (no 400) but silently dropped, not applied.
