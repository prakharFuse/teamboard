---
name: overview
description: What TeamBoard is and where to find the canonical docs — read this first
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/index.ts
  - server/src/routes/members.ts
---

TeamBoard is a small Express + SQLite + React app. For the project summary, layout,
commands, endpoint list, and the API rules (error shape, parameterized SQL), see
[../../CLAUDE.md](../../CLAUDE.md) and [../../README.md](../../README.md) — both are
accurate as of this pass and don't need restating here.

This page only covers what those docs don't: see [[gotchas]] for code-verified
sharp edges, [[architecture]] for the request/data flow diagram, [[data-model]] for
the schema, and `conventions/` for patterns not written down anywhere else.

One correction to keep in mind while reading CLAUDE.md's endpoint list: `PATCH
/api/members/:id` only updates `name`, `email`, `role`, `department` — `start_date`
and `is_active` are silently ignored if sent (server/src/routes/members.ts:92-101).
This isn't a contradiction of anything CLAUDE.md states, just a detail it leaves
implicit.
