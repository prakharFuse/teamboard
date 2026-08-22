---
name: gotchas
description: Known sharp edges in the members API — read before touching validation, export, or delete/patch behavior
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
---

## Open, intentionally-failing test (TM-105)

`server/src/routes/members.test.ts` has a test, `'POST /api/members rejects an invalid department with 400'`, that is **currently RED on `main` by design** — the file's header comment says it's test-first against a not-yet-built feature. `POST /api/members` (`server/src/routes/members.ts:26-46`) accepts any non-empty `department` string with no allowlist or lookup check. Resolving this means adding department validation to the POST handler (and likely PATCH too, since it also writes `department` unchecked at `server/src/routes/members.ts:92-101`) so the test goes green — don't just delete or loosen the test to "fix" the CI failure.

There's no canonical list of valid departments anywhere in the codebase (no enum, config, or DB table) — seed data uses `Engineering`, `Product`, `Design`, `Eng`, `Marketing`, `Sales`, `Human Resources` (`server/src/db.ts:37-44`), including the `Engineering`/`Eng` inconsistency noted in [[data-model]]. Any validation work needs to define that source of truth first.

## CSV export has no quoting/escaping

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds each CSV row with a plain template-string join: `` `${r.id},${r.name},${r.email},${r.role},${r.department},${r.start_date},${r.is_active}` ``. A `name`, `role`, or `department` value containing a comma, quote, or newline will silently shift/break columns in the downloaded file — there is no RFC 4180 quoting. This matters more than usual here since the export is explicitly for "HR integration" (see ../../CLAUDE.md).

## PATCH is narrower than the full row

`PATCH /api/members/:id` only accepts `name`, `email`, `role`, `department` in the body (`server/src/routes/members.ts:92`) — `start_date` and `is_active` cannot be updated through the API at all. The client (`client/src/App.tsx`) never calls PATCH today (no edit UI, only add/remove), so this hasn't surfaced yet, but it will if an edit form is added.

## No authentication on any route

`server/src/index.ts` mounts `membersRouter` with only `cors()` and `express.json()` — every `/api/members*` route (including destructive `DELETE`) is open to any caller that can reach the server. Fine for the current internal/demo scope, but worth flagging before exposing this beyond localhost.
