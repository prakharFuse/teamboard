---
name: overview
description: What TeamBoard is, where things live, and what the top-level docs already cover
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
  - client/src/App.tsx
---

TeamBoard is a single-workspace Express + React + SQLite app for an internal
team directory. Stack, layout, commands, and the endpoint list are accurate
in ../../CLAUDE.md and ../../README.md — read those first; this page only
adds what they don't cover.

## Gaps not covered by CLAUDE.md / README

- **Delete is destructive, not a soft delete.** `members` has an `is_active`
  column and `GET /api/members` filters on `is_active = 1`, which looks like
  soft-delete plumbing — but `DELETE /api/members/:id` runs a real
  `DELETE FROM members WHERE id = ?` (server/src/routes/members.ts:115).
  Nothing in the codebase ever sets `is_active` to 0. Treat `is_active` as
  currently vestigial; don't assume "remove" is recoverable.
- **PATCH only touches four fields.** `PATCH /api/members/:id` accepts
  `name`, `email`, `role`, `department` — `start_date` and `is_active` are
  not updatable through the API at all (server/src/routes/members.ts:92).
- **No department validation.** `POST /api/members` only checks that the
  five required fields are present/truthy; any string is accepted as a
  `department` (server/src/routes/members.ts:27-31). See
  [[gotchas]] for the intentional red test tracking this.
- **CSV export doesn't escape fields.** `/api/members/export` builds CSV via
  plain string interpolation with no quoting/escaping of commas or quotes in
  `name`/`role`/`department` (server/src/routes/members.ts:52-54). A name
  containing a comma will shift columns.
