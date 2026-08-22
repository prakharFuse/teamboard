---
name: overview
description: What TeamBoard is and where to find the canonical docs — read this first
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - CLAUDE.md
  - README.md
  - package.json
---

TeamBoard is a small internal team-directory app: Express + SQLite API, React (Vite) client. For project layout, commands, and the endpoint list, see [CLAUDE.md](../../CLAUDE.md) and [README.md](../../README.md) — both are accurate and current, so this page only adds what they don't cover.

## Gaps not covered by CLAUDE.md / README

- **`PATCH /api/members/:id` only updates `name`, `email`, `role`, `department`.** `start_date` and `is_active` are not patchable — see `server/src/routes/members.ts:92-101`. Neither doc lists the exact field allowlist.
- **No schema migrations exist.** `server/src/db.ts` runs `CREATE TABLE IF NOT EXISTS` on every `getDb()` call — there is no migration mechanism. Changing the `members` schema means hand-editing this DDL and it will only apply to new database files (existing `data/team.db` files won't be altered).

See [[gotchas]] for the department-validation gap and CSV export bug, [[architecture]] for the request flow, and [[data-model]] for the `members` table shape.
