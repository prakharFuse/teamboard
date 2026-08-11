---
name: gotchas
description: Code-verified behavior that surprises people coming from the README/CLAUDE.md endpoint list — read before changing members.ts
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
---

- **`DELETE /api/members/:id` is a hard delete, not a soft delete.** `members.ts:115` runs `DELETE FROM members WHERE id = ?`. The `is_active` column exists and is used to filter reads, but no handler ever sets it to `0` — there's no soft-delete/restore path despite the schema looking like it was designed for one.
- **Route order in `members.ts` is load-bearing.** `/export` and `/stats` (`members.ts:48`, `members.ts:60`) are declared *before* `/:id` (`members.ts:71`). If a new static route is added after `/:id`, Express will match it as an id param instead — `GET /api/members/anything` currently falls through to the `:id` handler and 404s as "Member not found" rather than matching a route by name.
- **`PATCH /api/members/:id` only updates `name`, `email`, `role`, `department`** (`members.ts:92`) — `start_date` and `is_active` are silently ignored even if sent in the body. CLAUDE.md's "update member fields" doesn't specify which fields, so this isn't a doc contradiction, but it's easy to assume PATCH is a full update when it isn't.
- **CSV export does not escape fields.** `members.ts:52-54` interpolates `name`, `email`, `role`, `department` directly into comma-joined CSV rows with no quoting. A member name containing a comma (e.g. "Smith, Jr.") will silently shift columns in the downloaded file — there's no CSV-injection sanitization either.
- **`POST /api/members` performs no department validation.** `server/src/routes/members.test.ts` ships an intentionally red test, `rejects an invalid department with 400`, explicitly tied to ticket TM-105. It fails on `main` today by design — treat it as a marker for pending work, not a bug in the test itself. Don't "fix" it by deleting or loosening the assertion; the fix belongs in `members.ts`'s POST handler.
- **Tests require `TEAMBOARD_DB_PATH=':memory:'` set before the first `getDb()` call**, not just before the test file runs — `getDb()` memoizes a module-level singleton (`db.ts:9`), so setting the env var late (e.g. inside a `before()` hook) is too late if any handler already ran. `members.test.ts` sets it at module top-level for this reason.
