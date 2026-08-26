---
name: api-routes
description: Handler-writing conventions in server/src/routes — error shapes, partial updates, uniqueness handling
type: convention
scope:
  - server/src/routes/**
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
sources_sha256:
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- Validation failures return `res.status(400).json({ error: '<message>' })` then an explicit `return;` (never `return res.json(...)` — handlers are typed `void`). Follow this shape for new required-field or format checks rather than throwing.
- Uniqueness violations (email) are caught by checking `err.message.includes('UNIQUE')` after the insert throws, then mapped to `409` (`members.ts:39-44`). Any other error is rethrown (`throw err;`) rather than swallowed — don't add a catch-all here.
- Partial updates use `COALESCE(?, column)` with `field ?? null` args (`members.ts:93-101`) so omitted body fields keep their current DB value. Extend this pattern for any new patchable column rather than building the SQL string dynamically.
- Not-found lookups follow the same shape everywhere: `SELECT ... WHERE id = ?`, then `if (!row) { res.status(404).json({ error: '... not found' }); return; }` before doing anything else with the row.
