---
name: api-style
description: Extra route-handler conventions not in CLAUDE.md — static-path-before-:id ordering and PATCH's field allowlist
type: convention
scope:
  - server/src/routes/**
updated: '2026-08-12'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
---

Error shape and parameterized-SQL rules are already documented in
`../../CLAUDE.md` — follow those as-is. Two things that doc doesn't cover:

- **Static routes go above `:id` routes.** See `[[gotchas]]` for why —
  `/export` and `/stats` must stay declared before `/:id`.
- **`PATCH /:id` only accepts `name`, `email`, `role`, `department`**
  (`members.ts:92`) — `start_date` and `is_active` are silently ignored if
  sent in the body (no error, they just don't get written). If a change needs
  to make either of those editable, extend the `COALESCE` update statement at
  `members.ts:93` and the destructure at `members.ts:92` together; don't add a
  separate endpoint for it.
