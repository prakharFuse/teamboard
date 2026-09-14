---
name: data-model
description: The members table schema, its only entity, and the soft-delete gap
type: knowledge
scope: global
updated: 2026-09-14 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
erDiagram
    MEMBERS {
        int id PK
        string name
        string email UK
        string role
        string department
        string start_date
        int is_active
        string created_at
        string updated_at
    }
```

Single-table schema, defined inline in `server/src/db.ts:19-29` (no migrations directory — schema changes mean editing this `CREATE TABLE IF NOT EXISTS` statement directly, which only affects fresh databases since it won't `ALTER` an existing `data/team.db`).

## Gotchas

- `is_active` exists and `GET /api/members` filters on it (`members.ts:21`), but `DELETE /api/members/:id` (`members.ts:106-117`) does a hard `DELETE FROM members`, not a soft delete (`UPDATE ... SET is_active = 0`). Nothing in the codebase ever sets `is_active` to `0` — it only ever holds its default value of `1`. Anyone relying on `is_active` to mean "soft-deleted" will be surprised: it currently just means "seeded/inserted, i.e. always 1."
- `email` is `UNIQUE` (`db.ts:22`); `POST /api/members` (`members.ts:26-46`) catches the resulting SQLite constraint error by string-matching `err.message.includes('UNIQUE')` and returns 409 — there's no upfront existence check, so any other `UNIQUE` violation added later to this table would also surface as "member with this email already exists," which would be misleading.
- `PATCH /api/members/:id` (`members.ts:83-104`) does not accept or update `start_date` or `is_active`, only `name`, `email`, `role`, `department` — this is a narrower field set than `POST` accepts.
