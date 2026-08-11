---
name: backend-patterns
description: Non-obvious error-handling and update patterns in server/src/routes — read before touching members.ts
type: convention
scope:
  - server/src/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

See ../../CLAUDE.md's Rules section for the baseline (error shape `{ "error": string }`, parameterized SQL). Two patterns it doesn't spell out:

- **Unique-constraint violations are caught by string-matching, not an error code.** `node:sqlite` throws a generic `Error` on constraint violation, so `members.ts:40` checks `err.message.includes('UNIQUE')` to turn it into a 409. Adding another `UNIQUE` column reuses this same check correctly, but the check would also fire on any unrelated SQLite error whose message happens to contain "UNIQUE".
- **PATCH updates via `COALESCE(?, column)`, always passing `field ?? null` for every field** (`members.ts:92-101`). This means an explicit `null` in the request body is indistinguishable from an omitted field — both keep the existing value. There's no way to clear a field to empty/null via PATCH today.
