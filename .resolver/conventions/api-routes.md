---
name: api-routes
description: Route ordering and error/SQL conventions for server/src/routes — read before adding a members endpoint
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

For error response shape (`{ "error": string }`) and the parameterized-SQL rule, see ../../CLAUDE.md — both are followed consistently in members.ts.

## Gap: static routes must be declared before `/:id`

In server/src/routes/members.ts, `/export` and `/stats` are registered *before* `/:id` (lines 48, 60, then 71). Express matches routes in declaration order, so if a new static path (e.g. `/search`) were added after `/:id`, it would instead be swallowed by the `/:id` handler with `id="search"`. Any new non-parameterized member route must be added above the `router.get('/:id', ...)` line.
