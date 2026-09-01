---
name: gotchas
description: Non-obvious traps — the intentionally-red CI test and node:sqlite quirks
type: knowledge
scope: global
updated: 2026-09-01 (IONE-959)
captured_sha: 0b416e84bdcfdfbbae5c54f529d804b02e25baf8
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
sources_sha256:
  server/src/routes/members.test.ts: 1adc557969069dfb121738c586e7bc748b612b87d790f51fcef0257496d872b6
  server/src/routes/members.ts: 73223ab7cde69649343562263ce219e9903fa0d47c8c400551df3a42a07c5d1a
---

## Every write path touching `email` must catch the UNIQUE constraint

`PATCH /api/members/:id` didn't originally catch the SQLite `UNIQUE`
constraint error the way `POST /api/members` did. Editing a member's profile
to an email already in use threw an uncaught exception, which Express's
default handler turned into an HTML error page instead of a clean 409 — this
is what "editing a team member's profile sometimes fails with a server error
page" turned out to be. Both routes now wrap the write in try/catch and match
`err.message.includes('UNIQUE')` (see [[data-model]]). Any new route that
inserts/updates `email` needs the same guard, or a duplicate-email write will
crash instead of returning 409.
