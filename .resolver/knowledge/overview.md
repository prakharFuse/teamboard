---
name: overview
description: Where to find TeamBoard's stack, layout, commands, and API surface; what's not in the existing docs
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/routes/members.ts
  - client/src/App.tsx
---

Stack, directory layout, commands, and the full endpoint list are already documented — see ../../CLAUDE.md and ../../README.md. Don't re-derive those here; read them first.

## Gaps not covered by CLAUDE.md / README

- **PATCH `/api/members/:id` field set is narrower than "update member fields" implies.** Only `name`, `email`, `role`, `department` are patchable (`server/src/routes/members.ts:92`). `start_date` and `is_active` cannot be changed through this endpoint — there is no way to edit a member's start date or reactivate a member once inserted.
- **POST validation is presence-only.** `server/src/routes/members.ts:26-31` checks the five fields are truthy but does not validate email format, or that `department` is one of a known set. See [[gotchas]] for the concrete consequence (TM-105).
- **No route exists to undo a delete.** `DELETE /api/members/:id` is a hard row delete, not a soft-deactivate, even though the schema has an `is_active` column — see [[data-model]] and [[gotchas]].

For the real data shape and system wiring, see [[data-model]] and [[architecture]].
