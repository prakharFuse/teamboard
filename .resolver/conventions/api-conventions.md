---
name: api-conventions
description: Route-handler conventions for server/src/routes — error shape, SQL style, lazy DB access
type: convention
scope:
  - server/**
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
---

Error response shape (`{ "error": string }`) and the parameterized-SQL-only rule are already stated in ../../CLAUDE.md — follow those as written.

## Derived conventions from the existing route

- Every handler calls `getDb()` itself at the top of the function body (`server/src/routes/members.ts:19,32,49,61,72,84,107`) rather than getting `db` injected — `getDb()` is a memoized singleton (`server/src/db.ts:9-47`), so this is cheap and keeps handlers self-contained. Follow the same pattern for new routes rather than hoisting a shared `db` variable.
- Lookup-then-404 is done by a `SELECT` for the row followed by an `if (!row)` check, in `GET /:id`, `PATCH /:id`, and `DELETE /:id` alike (`server/src/routes/members.ts:71-80`, `85-91`, `108-114`) — even `DELETE` re-selects the row first purely to produce a 404 instead of relying on `changes === 0`. Match this shape for new single-resource routes.
- Required-field validation on `POST` is a flat `if (!a || !b || ...)` against destructured `req.body` fields, with one combined error message listing all required fields (`server/src/routes/members.ts:27-31`) — not per-field errors.
- `PATCH` uses `COALESCE(?, column)` in the `UPDATE` statement so omitted fields are left unchanged (`server/src/routes/members.ts:93-101`); it does not merge/validate the body beyond that.
