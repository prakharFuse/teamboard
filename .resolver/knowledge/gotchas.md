---
name: gotchas
description: Known intentional-failure state (TM-105) and other surprises before touching members.ts or its tests
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
---

## TM-105: the department-validation test is intentionally red

`server/src/routes/members.test.ts:70-85` ("POST /api/members rejects an
invalid department with 400") fails on the current tree by design. The test
file's header comment says this is test-first work for ticket TM-105: add
department validation to `POST /api/members`. Today the handler
(server/src/routes/members.ts:26-46) accepts any non-empty `department`
string and returns 201.

If asked to fix or extend department handling: making this test pass means
adding real validation (e.g. an allowed-department set) to the POST handler,
not loosening or deleting the test. If asked to add unrelated features to
`members.ts`, leave this red test as-is unless the task is TM-105 itself.

## Other surprises

- `PATCH /api/members/:id` silently ignores unknown/omitted fields via
  `COALESCE(?, name)` — passing `email: null` explicitly is indistinguishable
  from omitting `email`, both leave the old value. There's no way to clear a
  field to empty string through this endpoint. See [[overview]].
- Route handlers don't validate `req.params.id` — `Number('abc')` becomes
  `NaN`, and the `SELECT ... WHERE id = ?` lookup then just misses, so the
  API returns a plain 404 rather than a 400. Not a bug to "fix" incidentally,
  but don't assume a 400 exists for malformed IDs.
