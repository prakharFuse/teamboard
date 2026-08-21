---
name: api-conventions
description: Error shape and SQL parameterization rules for server/src/routes — apply when adding/editing endpoints
type: convention
scope:
  - server/src/**
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
sources_sha256:
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Error response shape and the parameterized-SQL rule are already documented in ../../CLAUDE.md ("Rules" section) — follow those as stated.

Derived, code-verified additions not covered there:
- Route handlers return `void` and end each branch with an explicit `return` after `res.status(...).json(...)` for early exits (e.g. server/src/routes/members.ts:29-31, 88-91) — the `(req, res): void` handler signature relies on this pattern to satisfy TypeScript, not on Express behavior.
- Known SQLite errors are pattern-matched on `err.message.includes('UNIQUE')` rather than a typed error code (server/src/routes/members.ts:40) — there's no SQLite error-code enum in use; any other error type is rethrown (`throw err`) rather than handled.
- `PATCH` uses `COALESCE(?, column)` with `?? null` fallbacks (server/src/routes/members.ts:92-101) so omitted fields are left unchanged — passing an explicit `null` from a client is indistinguishable from omitting the field.
