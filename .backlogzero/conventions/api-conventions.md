---
name: api-conventions
description: Request/response and validation conventions for the members router — read before adding an endpoint or field
type: convention
scope:
  - server/src/routes/**
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
sources_sha256:
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- Handlers validate required fields with a single `if (!a || !b || ...)` guard returning
  `400 { error: string }` (`server/src/routes/members.ts:28-31`) — no per-field error detail, one
  combined message listing all required fields.
- Not-found lookups follow a fetch-then-branch pattern: `SELECT ... WHERE id = ?`, then
  `if (!row) { res.status(404)...; return }` before doing anything else (repeated in `GET /:id`,
  `PATCH /:id`, `DELETE /:id`). Follow this shape rather than relying on SQL affected-row counts.
- `PATCH /:id` uses `COALESCE(?, column)` with `field ?? null` bindings so omitted body fields are
  left unchanged (`server/src/routes/members.ts:92-101`) — passing an explicit falsy value like
  `""` will still coerce to `null` via `?? null` and then be ignored by `COALESCE`. There is no way
  to explicitly clear a field to empty string through this endpoint today.
- Row types are always cast `as unknown as <Row>` from `node:sqlite`'s untyped `get`/`all` — see
  `MemberRow` in `server/src/routes/members.ts:4-14`. New queries should define/reuse a row
  interface rather than inlining ad hoc casts.

## Known contract gap

`POST /api/members` and `PATCH /api/members/:id` accept any `department` string — no allow-list
validation exists yet. `server/src/routes/members.test.ts` already encodes the expected contract
(`POST` with an invalid department → `400`) and is currently failing against this behavior; that
test is the executable spec for any department-validation work, don't duplicate it with a new test
file.
