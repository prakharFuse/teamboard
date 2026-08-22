---
name: data-model
description: The members table schema and the is_active soft-delete flag that isn't actually used for deletes
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Single-table schema, created inline in `getDb()` — there is no migrations folder or ORM.

```mermaid
erDiagram
  MEMBERS {
    INTEGER id PK
    TEXT name
    TEXT email UK
    TEXT role
    TEXT department
    TEXT start_date
    INTEGER is_active "default 1"
    TEXT created_at
    TEXT updated_at
  }
```

- `email` has a `UNIQUE` constraint; `POST /api/members` catches the resulting SQLite error and turns it into a `409` (server/src/routes/members.ts:39-44).
- `is_active` exists and `GET /api/members` / `GET /api/members/stats` filter on `is_active = 1`, but nothing in the codebase ever sets it to `0` — `DELETE /api/members/:id` hard-deletes the row (`DELETE FROM members WHERE id = ?`, server/src/routes/members.ts:115) instead of flagging it inactive. Treat `is_active` as effectively dead/unused rather than a working soft-delete mechanism.
- `PATCH /api/members/:id` only updates `name`, `email`, `role`, `department` (server/src/routes/members.ts:92-101) — `start_date` and `is_active` are not patchable despite existing on the row.
