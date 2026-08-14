---
name: data-model
description: The members table schema — single-table SQLite schema defined inline in db.ts
type: knowledge
scope: global
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
---

There's no migration system or `.sql` file — the schema is a single inline
`CREATE TABLE IF NOT EXISTS` in `server/src/db.ts:18-30`, run every time
`getDb()` is first called.

```mermaid
erDiagram
  MEMBERS {
    integer id PK
    text name
    text email UK
    text role
    text department
    text start_date
    integer is_active "default 1"
    text created_at "default datetime('now')"
    text updated_at "default datetime('now')"
  }
```

Just the one table — no foreign keys, no joins anywhere in the codebase.

- `email` has a `UNIQUE` constraint (`server/src/db.ts:22`); `POST /api/members` catches the resulting SQLite error by matching `err.message.includes('UNIQUE')` and returns 409 (`server/src/routes/members.ts:40-43`) — there's no pre-check query, the constraint violation *is* the validation.
- `is_active` defaults to 1 and is set once at insert time; nothing in the codebase ever writes it back to 0 (see `gotchas.md` — `DELETE` hard-deletes the row instead).
- `updated_at` is only refreshed by `PATCH` (`server/src/routes/members.ts:99`); `POST` and the seed inserts leave it at its `CREATE TABLE` default.
