---
name: api-conventions
description: Response-shape and route-handler patterns for server/src/routes — read before adding or changing an endpoint
type: convention
scope:
  - server/src/**
updated: 2026-08-11 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

For error format and SQL parameterization rules, see `../../CLAUDE.md` — those are accurate as stated.

## Not covered by CLAUDE.md

- **Response shapes are inconsistent by design of the existing code, not a convention to copy.** `GET /` wraps its result as `{ members: [...] }` and `GET /stats` returns `{ total, byDepartment }`, but `GET /:id`, `POST /`, and `PATCH /:id` all return the raw row object with no wrapper key (`server/src/routes/members.ts:23,38,68,103`). When adding a new endpoint, match whichever existing sibling endpoint is most similar in shape (single resource vs. collection) rather than inventing a third convention.
- **Every handler calls `getDb()` itself** rather than taking it as a parameter or middleware — there's no request-scoped DB context. Keep new handlers consistent with this: call `getDb()` at the top of the handler.
- **Row existence checks are duplicated inline** in `GET /:id`, `PATCH /:id`, `DELETE /:id` — each re-runs `SELECT * FROM members WHERE id = ?` and returns `404` if `undefined` (`server/src/routes/members.ts:73-80, 85-91, 108-114`). There's no shared `findMemberOrThrow` helper; new `:id` routes should follow the same inline pattern rather than introducing a helper for a three-route repeat.
- **Route order matters:** `/export` and `/stats` are registered before `/:id` (`server/src/routes/members.ts:48,60,71`) so Express doesn't treat `"export"`/`"stats"` as an `:id` value. Any new fixed-path sibling route (e.g. `/search`) must be added before the `/:id` route for the same reason.
