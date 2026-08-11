---
name: data-model
description: TeamBoard's single-table SQLite schema (members)
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
        integer id PK
        text name
        text email "UNIQUE"
        text role
        text department
        text start_date
        integer is_active "default 1"
        text created_at "default now"
        text updated_at "default now"
    }
```

Single-table schema, created inline in `getDb()` (`server/src/db.ts:18-30`) — no migration files, no ORM, no foreign keys. `email` is the only uniqueness constraint; `department` is a free-text column with no allow-list (see [[overview]]).
