---
name: api-routes
description: Response-shape, error-handling, and route-ordering conventions for server/src/routes
type: convention
scope:
  - server/src/routes/**
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
sources_sha256:
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- Error responses are always `{ error: string }` with a 4xx status (400 for missing/invalid fields, 404 for not found, 409 for conflicts) — no error-code enum or shared error type, just literal status + message per handler (`server/src/routes/members.ts:29,41,77,89,112`).
- Success responses return the bare resource or a named collection key, not a generic envelope: single member → the row object directly (`res.json(member)`), list → `{ members: [...] }`, stats → `{ total, byDepartment }`. Match whichever shape the existing endpoint uses rather than introducing a new envelope.
- Partial updates use SQL `COALESCE(?, column)` with `field ?? null` so omitted fields keep their DB value (`server/src/routes/members.ts:92-101`) — this is the pattern to extend if a new PATCH-able field is added, not a manual "fetch, merge in JS, re-write all columns" approach.
- Literal sub-paths (`/export`, `/stats`) must be declared before the `/:id` param route in the router — see [[gotchas]] for why.
- Handlers fetch the row first and 404 before mutating (`GET/PATCH/DELETE /:id` all do a `SELECT` then check `if (!member)` before acting) — follow this existence-check-first pattern for any new `/:id`-scoped route.
