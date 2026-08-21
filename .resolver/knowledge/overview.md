---
name: overview
description: TeamBoard project map and gaps not covered by CLAUDE.md/README — read first for orientation
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - client/src/App.tsx
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

For stack, layout, commands, and the endpoint list, see ../../CLAUDE.md and ../../README.md — both are accurate and current.

## Gaps not documented in CLAUDE.md/README

- **No department validation.** `POST /api/members` accepts any string for `department` (server/src/routes/members.ts:26-46) — there's no allow-list. This is intentional and tracked: see [[testing]] for the CI test that's red until it's fixed (TM-105).
- **DELETE is a hard delete, not a soft delete.** The `members` table has an `is_active` flag (server/src/db.ts:26) and `GET /api/members` filters on it, but `DELETE /api/members/:id` (members.ts:106-117) actually runs `DELETE FROM members`, not an `is_active = 0` update. The flag is currently unused by any write path — nothing ever sets it to 0.
- **PATCH only updates name/email/role/department.** `start_date` and `is_active` are not accepted by `PATCH /api/members/:id` (members.ts:83-104), even though the client and CLAUDE.md describe it generically as "update member fields."
- **CSV export has no quoting/escaping.** `GET /api/members/export` (members.ts:48-58) joins raw field values with commas; a name/role/department containing a comma or newline will silently corrupt the CSV.
