---
name: api-routes
description: Route ordering and error-shape rules for the members router
type: convention
scope:
  - server/src/routes/**
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
sources_sha256:
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Error shape (`{ "error": string }`) and parameterized-SQL rules are already stated in `../../CLAUDE.md` — see that file.

Static sub-paths (`/export`, `/stats`) are registered before the `/:id` param route in `server/src/routes/members.ts`. Express matches routes in declaration order, so `/:id` would otherwise swallow `/export` and `/stats` as an `id` value. Any new static route under `/api/members/*` (e.g. a future `/search`) must be added before the `/:id` handlers, not after.
