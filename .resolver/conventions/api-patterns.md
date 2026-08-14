---
name: api-patterns
description: Route-handler idioms used across server/src/routes/members.ts — follow these when adding endpoints
type: convention
scope:
  - server/src/routes/**
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

See `../../CLAUDE.md` for the project-wide rules (error shape `{ "error": string }`, parameterized SQL, `node:sqlite` requirement) — those hold and aren't repeated here.

Derived patterns from the existing handlers, worth matching in new ones:

- **Lookup-then-404 before mutating.** `PATCH`, `DELETE`, and `GET /:id` all do a `SELECT * FROM members WHERE id = ?` first and return `404 { error: 'Member not found' }` if nothing comes back, before doing anything else. New id-scoped endpoints should follow the same shape rather than relying on `changes === 0` from an `UPDATE`/`DELETE`.
- **Partial updates use `COALESCE(?, column)`.** `PATCH /:id` passes `field ?? null` for every optional field and lets SQLite's `COALESCE` keep the existing value when the param is `null` (`server/src/routes/members.ts:92-101`). This only works because none of the updatable columns are legitimately nullable — don't reuse this pattern for a column where `null` is a valid target value.
- **Unique-constraint violations are caught by string-matching the driver error**, not by a pre-check `SELECT`: `POST /` catches `err instanceof Error && err.message.includes('UNIQUE')` and maps it to 409, then re-throws anything else (`server/src/routes/members.ts:39-45`). Follow this same catch-and-rethrow shape for other constraints rather than adding a race-prone pre-check query.
- **Route order matters:** `GET /export` and `GET /stats` are registered before `GET /:id` (`server/src/routes/members.ts:48,60,71`) specifically so Express doesn't treat `export`/`stats` as an `:id` value. Any new literal-path `GET` route under `/api/members` must go before `GET /:id` for the same reason.
- **No request-body validation library.** Required-field checks are manual `if (!x || !y ...)` blocks (`server/src/routes/members.ts:28`); there's no zod/joi/express-validator in the dependency list (`package.json`). Match the manual-check style unless you're intentionally introducing a validation library project-wide.
