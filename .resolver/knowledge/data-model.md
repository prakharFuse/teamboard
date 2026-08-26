---
name: data-model
description: The members table schema and the soft-delete trap in is_active
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

Single-table schema, created in `getDb()` (`server/src/db.ts:18`):

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

## `is_active` is not wired to a soft delete

The column name and `GET /api/members`'s `WHERE is_active = 1` filter (`server/src/routes/members.ts:21`) imply a soft-delete pattern, but no code path ever sets `is_active = 0`. `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) issues `DELETE FROM members WHERE id = ?` — a **hard delete**. If a feature needs "deactivate without erasing," it doesn't exist yet; `is_active` currently only ever holds its seed/insert default of `1`.

`PATCH /api/members/:id` (`server/src/routes/members.ts:83-104`) updates `name`, `email`, `role`, `department` via `COALESCE(?, column)` — passing `undefined` for a field leaves it unchanged. `start_date` and `is_active` are not patchable through this route.
