---
name: api-routes
description: Conventions for adding/modifying Express routes in server/src/routes
type: convention
scope:
  - server/src/routes/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

[../../CLAUDE.md](../../CLAUDE.md) already states the two hard rules — `{ "error": string }`
error shape and parameterized `?` SQL placeholders (never string-concatenated SQL). This page
covers what that doc doesn't.

- Route handlers are typed `(req: Request, res: Response): void` and return early with a bare
  `return;` after sending an error response, rather than `else`-branching
  (`server/src/routes/members.ts:26-46` is the pattern to follow for new handlers).
- Row shapes are read via `db.prepare(...).get()/.all()` cast through `as unknown as <RowType>`
  (see `MemberRow` in `members.ts:4-14`) — `node:sqlite`'s types don't know your schema, so this
  double-cast is the established way to get a typed row back, not a lint escape hatch to avoid.
- New fixed-path routes (e.g. another `/api/members/<word>` endpoint) must be registered above
  `router.get('/:id', ...)` — see [[overview]] for why route-registration order matters here.
- Known unique-constraint handling: catch by checking `err.message.includes('UNIQUE')`
  (`members.ts:40`) rather than a SQLite error code — match this string-based pattern for any new
  unique columns rather than introducing a different error-detection approach.
