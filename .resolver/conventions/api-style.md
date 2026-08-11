---
name: api-style
description: Request/response and SQL conventions for the members API, beyond what CLAUDE.md states
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

See [CLAUDE.md](../../CLAUDE.md) for the baseline rules (error shape `{ "error": string }`, parameterized SQL only). Verified in `server/src/routes/members.ts` and extending with what's not stated there:

- Validation on `POST /api/members` is presence-only (`!name || !email || !role || !department || !start_date`, `server/src/routes/members.ts:28`) — no format checks (e.g. email shape) and no allow-list checks (e.g. department). Any new field-level validation should follow the existing pattern: check in the handler, return `400` with a descriptive `error` string before touching the DB.
- The one existing business-rule error path is the UNIQUE-email conflict, mapped to `409` by string-matching `err.message.includes('UNIQUE')` (`server/src/routes/members.ts:39-44`) — not a typed SQLite error class. Follow this same string-match approach for other constraint violations until `node:sqlite` exposes typed error codes.
- `PATCH /api/members/:id` uses `COALESCE(?, column)` per field so omitted fields keep their existing value (`server/src/routes/members.ts:93-101`) — it does not accept `start_date` at all, so a caller cannot correct a member's start date via PATCH today.
