---
name: api-conventions
description: Status-code and validation patterns used across members.ts routes, beyond what CLAUDE.md's Rules section states
type: convention
scope:
  - server/src/routes/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

Error shape (`{ "error": string }`) and parameterized SQL are already
documented in ../../CLAUDE.md under "Rules" — that's accurate, follow it.
This page covers the patterns CLAUDE.md doesn't spell out.

- **Required-field checks are a single truthy-check block at the top of the
  handler**, before touching the DB (members.ts:27-31): `if (!a || !b || ...)`
  → 400 with one combined message listing all required fields. New POST-style
  routes should follow this shape rather than per-field error messages.
- **Status codes in use:** 200 (default success), 201 (POST create), 400
  (missing required fields), 404 (`:id` lookup miss), 409 (unique-constraint
  violation on `email`). There's no 422 or 500 handling anywhere — unexpected
  errors just `throw err` and fall through to Express's default handler
  (members.ts:44).
- **Existence checks happen via a throwaway `SELECT` before `UPDATE`/`DELETE`**
  (members.ts:85-91, 108-114), not via checking affected-row counts after the
  write. Keep this pattern for new `:id` routes so 404s are consistent.
- **One router per resource, mounted by path in `index.ts`.** There's
  currently only `membersRouter` at `/api/members` (index.ts:11) — a new
  resource should get its own file under `server/src/routes/` and its own
  `router.use()` line, matching this file's shape (a single `Router()`
  export default, no shared middleware file).
