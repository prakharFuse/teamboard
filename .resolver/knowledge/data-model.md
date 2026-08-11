---
name: data-model
description: The members table schema — single-table SQLite schema verified from db.ts
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

Single-table schema, created with `CREATE TABLE IF NOT EXISTS` on first `getDb()` call
(`server/src/db.ts:18-30`) — there is no migrations directory or migration tool; schema changes
mean editing this `CREATE TABLE` statement directly. `email` is the only unique constraint
(`UNIQUE`, enforced at the DB level); `members.ts:39-43` catches the resulting SQLite error by
matching the string `'UNIQUE'` in the error message to return a 409, rather than checking a
structured error code. See [[gotchas]] for the `is_active` column's actual (unused) behavior.
