---
name: data-model
description: Schema for the single `members` table and how is_active relates to soft/hard delete
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
---

Single-table schema, created inline in `getDb()` (`server/src/db.ts:18-30`) — there is no migrations directory or ORM.

```mermaid
erDiagram
  MEMBERS {
    integer id PK
    text name
    text email "UNIQUE"
    text role
    text department
    text start_date
    integer is_active "default 1"
    text created_at "default datetime(now)"
    text updated_at "default datetime(now)"
  }
```

`is_active` looks like a soft-delete flag (`GET /api/members` filters `WHERE is_active = 1`), but nothing ever sets it to `0` — `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) issues a real `DELETE FROM members`, permanently removing the row. See [[gotchas]] before adding a "restore deleted member" feature — the column exists but the deactivate path doesn't.
