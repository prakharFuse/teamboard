---
name: data-model
description: The members table schema — read before adding fields, migrations, or queries
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

Single-table schema, created inline in `getDb()` via `CREATE TABLE IF NOT EXISTS` — there is no migration system or separate schema file.

```mermaid
erDiagram
    members {
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

## Non-obvious facts

- `email` has a `UNIQUE` constraint enforced at the DB level; `POST /api/members` catches the SQLite `UNIQUE` error and turns it into a 409 (`server/src/routes/members.ts`). No other route path checks uniqueness before writing.
- `department` is a free-text column — there is no enum/lookup table constraining it, and no application-level validation on insert or update (see [[gotchas]]).
- `is_active` defaults to `1` on insert and is never set to `0` anywhere in the codebase — `DELETE /api/members/:id` performs a real `DELETE FROM members`, not a soft-delete flip. The column only affects `GET /api/members` and `/stats`, which filter `WHERE is_active = 1`.
- Seed data (8 members) is inserted once, only when the table is empty (`COUNT(*) === 0` check), so it won't re-seed after any row exists.
