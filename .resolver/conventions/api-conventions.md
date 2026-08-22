---
name: api-conventions
description: Route-handler conventions in server/src/routes — error shape, lookups, SQL param style — and the validation gap new routes should close, not repeat
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

The error-response shape and the "parameterized SQL only" rule are already documented in [CLAUDE.md](../../CLAUDE.md) and hold true for every query in `members.ts` — no restatement needed here.

Patterns worth matching that aren't in CLAUDE.md, inferred from `members.ts`:

- **Existence checks before mutation**: `GET/PATCH/DELETE /:id` all do a `SELECT * FROM members WHERE id = ?` first and return `404` with `{ error: 'Member not found' }` before doing anything else (e.g. `members.ts:71-80`, `:85-91`, `:108-114`). New `:id` routes should follow the same look-up-then-404 shape rather than relying on the mutation itself to signal "not found" (e.g. checking `changes === 0` after an UPDATE/DELETE).
- **Required-field validation is manual and inline**: `POST /` checks `!name || !email || !role || !department || !start_date` directly (`members.ts:28`) rather than using a schema library (no `zod`/`joi` in `package.json`). Match this style for new required-field checks — don't introduce a validation library for a single route.
- **`department` is currently unvalidated** — any string is accepted on `POST` and `PATCH`. This is the known gap tracked as TM-105 (see [[overview]]); if you're adding department validation, the natural place is right after the existing required-field check in `POST /` (`members.ts:28-31`), returning `400` with the same `{ error: string }` shape used elsewhere — not a new error format.
