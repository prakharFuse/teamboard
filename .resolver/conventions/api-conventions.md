---
name: api-conventions
description: Members route handler patterns not already stated in CLAUDE.md — field allowlists, error handling
type: convention
scope:
  - server/src/routes/**
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

For the response error shape and parameterized-SQL rule, see [CLAUDE.md](../../CLAUDE.md#rules) — this page only adds handler-level patterns visible in the code but not written down there.

- **Every handler re-fetches from `getDb()` and re-queries by id rather than trusting a prior read.** `PATCH` and `DELETE` both do a `SELECT ... WHERE id = ?` first to return `404` before mutating (`server/src/routes/members.ts:83-104`, `:106-117`). Follow this existing-row-check-then-act shape for new mutating routes rather than relying on `changes` counts from the write itself.
- **`PATCH` uses `COALESCE(?, column)` per-field**, so passing `null`/omitting a field in the request body leaves that column unchanged — it does not clear it. There is no way to explicitly null out a field via this endpoint today.
- **Required-field validation on `POST` is a flat truthy check** (`if (!name || !email || ...)`, `server/src/routes/members.ts:28`), not per-field messages — the 400 response lists all required fields in one message rather than naming which one was missing.
- **Unique-constraint violations are detected by substring-matching the driver's error message** (`err.message.includes('UNIQUE')`, `server/src/routes/members.ts:40`) rather than a SQLite error code — if you add other `UNIQUE` columns, this same catch block will map any of their violations to the generic "member with this email already exists" message, which will be wrong.
