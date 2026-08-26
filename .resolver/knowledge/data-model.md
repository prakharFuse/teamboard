---
name: data-model
description: The members table schema and the soft-delete column that DELETE doesn't actually use
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Single-table schema, defined inline in `server/src/db.ts:19-30` (no migrations directory, no ORM):

```mermaid
erDiagram
  MEMBERS {
    INTEGER id PK
    TEXT name
    TEXT email UK
    TEXT role
    TEXT department
    TEXT start_date
    INTEGER is_active
    TEXT created_at
    TEXT updated_at
  }
```

## `is_active` is not what DELETE uses

The schema and `GET /api/members` (filters `WHERE is_active = 1`, `server/src/routes/members.ts:21`) imply a soft-delete model, but `DELETE /api/members/:id` (`server/src/routes/members.ts:115`) runs `DELETE FROM members WHERE id = ?` — a hard delete. `is_active` is written once at insert time (defaults to 1) and is never flipped to 0 anywhere in the codebase. Only `GET /api/members/export` reads inactive rows (it selects all rows, no `is_active` filter). Treat `is_active` as effectively dead/unused for writes — if a task asks for "soft delete" semantics, that requires changing the DELETE handler, not just reading the column.
