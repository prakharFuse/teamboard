---
name: api
description: TeamBoard API conventions (error shape, SQL) and what's not yet enforced — read before adding/changing routes
type: convention
scope:
  - server/**
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
sources_sha256:
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

For the baseline rules (error shape `{ "error": string }`, parameterized SQL, `node:sqlite` requirement), see ../../CLAUDE.md — accurate and followed throughout server/src/routes/members.ts.

Not yet enforced, despite the table implying otherwise:
- No request-body validation beyond presence checks (members.ts:28) — no type/format checks on `email` or `start_date`, and no department allow-list (see [[overview]], [[testing]]).
- `PATCH` silently ignores unknown/unsupported body fields (e.g. `start_date`, `is_active`) rather than rejecting them.
