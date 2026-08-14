---
name: api-style
description: HTTP status/error conventions in members.ts beyond what CLAUDE.md's Rules section states
type: convention
scope:
  - server/src/routes/**
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

See `../../CLAUDE.md` ("Rules") for the two documented rules: error shape
`{ "error": string }` and parameterized SQL. Both hold across every route in
`members.ts`. This page covers the status-code and lookup patterns the docs
don't spell out.

## Status codes in use

- `400` — missing required fields on `POST` (`server/src/routes/members.ts:29`). No type or format validation beyond presence, and no department allow-list (see `../knowledge/gotchas.md`).
- `404` — every `:id` route (`GET`, `PATCH`, `DELETE`) does a `SELECT ... WHERE id = ?` first and returns 404 if the row is missing, *before* doing anything else (e.g. `server/src/routes/members.ts:88-91`). Follow this look-up-then-act pattern for new `:id` routes rather than relying on `UPDATE`/`DELETE` affecting zero rows.
- `409` — unique email conflict on `POST`, detected by string-matching the thrown error's message for `'UNIQUE'` (`server/src/routes/members.ts:40`), not a pre-check `SELECT`.
- `201` — successful `POST` only; `PATCH` and `DELETE` return `200`.

## Partial update pattern

`PATCH` uses `COALESCE(?, column)` with `undefined ?? null` for every field
(`server/src/routes/members.ts:93-101`), so omitting a field in the request
body leaves it unchanged — but sending an explicit `null` also leaves it
unchanged (COALESCE treats SQL `NULL` as "keep existing"), it does not clear
the field. There's no way to null out a column via this route today.
