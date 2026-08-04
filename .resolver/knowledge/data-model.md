---
name: data-model
description: The members table schema (single-table SQLite DB)
type: knowledge
scope: global
updated: 2026-08-04 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/db.ts
---

```mermaid
erDiagram
  MEMBERS {
    integer id PK
    string name
    string email UK
    string role
    string department
    string start_date
    integer is_active
    string created_at
    string updated_at
  }
```

Single-table schema, created with `CREATE TABLE IF NOT EXISTS` on first `getDb()` call
(`server/src/db.ts:18-30`). No migrations mechanism — schema changes require editing this
`CREATE TABLE` statement directly (existing `data/team.db` files won't pick up column
changes automatically since `IF NOT EXISTS` is a no-op on an existing table).
