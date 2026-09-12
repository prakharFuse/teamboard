---
name: data-model
description: The single `members` table — schema and the soft-delete flag that isn't actually used for deletes
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

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

One table, defined inline in `getDb()` (`server/src/db.ts:11`) with `CREATE TABLE IF NOT EXISTS` — there is no migrations directory or schema file elsewhere.

**`is_active` is not a working soft-delete flag.** `GET /api/members` and `GET /api/members/stats` filter on `is_active = 1`, which implies members can be deactivated instead of removed — but no route ever sets `is_active` to `0`. `DELETE /api/members/:id` (`server/src/routes/members.ts:106`) does a hard `DELETE FROM members`. If a task calls for "removing" or "deactivating" a member, check which behavior is actually wanted — the current delete endpoint permanently destroys the row despite the column's presence.
