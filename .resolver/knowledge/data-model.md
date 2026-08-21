---
name: data-model
description: The members table schema — the only table in TeamBoard's SQLite DB
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
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
        integer is_active "default 1"
        text created_at
        text updated_at
    }
```

Single-table schema, created inline in `getDb()` (`server/src/db.ts`) — no
migration files or ORM. `email` has a `UNIQUE` constraint enforced at the DB
level; `members.ts` catches the resulting SQLite error message
(`err.message.includes('UNIQUE')`) to return 409 rather than checking
beforehand.

`department` and `role` are plain `TEXT` with no `CHECK` constraint, enum, or
foreign key — any string is accepted at the schema level. See [[gotchas]] for
why this matters for department validation work.
