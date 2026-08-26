---
name: data-model
description: The members table schema — read before adding fields, migrations, or queries
type: knowledge
scope: global
updated: '2026-08-26'
captured_sha: 221c3c38dc1464695c6402832dc7657e83d6d2a0
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

Single-table schema, created with `CREATE TABLE IF NOT EXISTS` on first
`getDb()` call — there is no migration tool; schema changes mean editing the
`db.exec(...)` DDL string in `server/src/db.ts:18-30` directly.

```mermaid
erDiagram
  MEMBERS {
    integer id PK
    text name
    text email UK
    text role
    text department
    text start_date
    integer is_active
    text created_at
    text updated_at
  }
```

- `email` has a `UNIQUE` constraint; `members.ts` catches the SQLite
  `UNIQUE` error message and turns it into a 409 (`server/src/routes/members.ts:39-44`)
  rather than checking existence up front.
- `department` is a free-text column with no `CHECK` constraint or foreign
  key — see [[gotchas]] for the resulting data inconsistency and the pending
  validation work (TM-105).
- `is_active` is a soft-delete flag (`GET /` and `/stats` filter on
  `is_active = 1`), but `DELETE /:id` (`server/src/routes/members.ts:106-117`)
  does a hard `DELETE FROM members`, not a soft delete — there is no code
  path that ever sets `is_active = 0`.
