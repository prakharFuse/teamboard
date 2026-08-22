---
name: data-model
description: The single `members` table schema — read before adding fields or migrations
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
---

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

There is exactly one table, created inline in `getDb()` (`server/src/db.ts:18-30`) —
no migration files or ORM. `email` has a `UNIQUE` constraint; `members.ts:39-43`
relies on the SQLite `UNIQUE` error message text (`"UNIQUE"` substring match) to
turn a duplicate-email insert into a 409 rather than a 500. If the SQLite error
message format ever changes, that check silently stops matching.

`is_active` is a soft-delete style flag, but `DELETE /api/members/:id`
(`members.ts:106-117`) does a hard `DELETE FROM members`, not a flip to
`is_active = 0` — there's no way to "deactivate" a member through the current API,
despite `is_active` existing as a column and `GET /api/members` filtering on it.
