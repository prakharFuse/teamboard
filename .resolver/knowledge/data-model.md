---
name: data-model
description: Schema of the members table (the only table in TeamBoard's SQLite DB)
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
    text department "no FK, no enum, no CHECK constraint"
    text start_date
    integer is_active "default 1"
    text created_at "default datetime('now')"
    text updated_at "default datetime('now')"
  }
```

Single-table schema, created inline in `getDb()` via `CREATE TABLE IF NOT EXISTS`. There is no migrations directory or ORM — schema changes mean editing the `CREATE TABLE` statement in `server/src/db.ts` directly.

`department` is a free-text column with no whitelist, enum, or `CHECK` constraint anywhere in the schema or application code — see [[gotchas]] for why this matters right now (TM-105).
