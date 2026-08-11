---
name: data-model
description: The members table schema — only table in the DB
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
    INTEGER id PK "AUTOINCREMENT"
    TEXT name
    TEXT email "UNIQUE"
    TEXT role
    TEXT department
    TEXT start_date
    INTEGER is_active "DEFAULT 1"
    TEXT created_at "DEFAULT now"
    TEXT updated_at "DEFAULT now"
  }
```

Single table, no foreign keys (`server/src/db.ts:18-30`). `email` has a `UNIQUE` constraint — `POST /api/members` catches the resulting SQLite error by matching `err.message.includes('UNIQUE')` and returns 409 (`server/src/routes/members.ts:39-43`); it isn't checked ahead of the insert.

`department` is a free-text column with no enum/check constraint at the DB level — see the known-red validation test noted in [[overview]].
