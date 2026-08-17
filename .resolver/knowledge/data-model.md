---
name: data-model
description: TeamBoard's single SQLite table (members) and its columns
type: knowledge
scope: global
updated: 2026-08-17 (IONE-959)
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
        integer is_active
        text created_at
        text updated_at
    }
```

Single-table schema, created inline in `getDb()` (server/src/db.ts:18-30) —
no migrations directory, no ORM. `email` has a `UNIQUE` constraint that
`POST /api/members` surfaces as a 409 (server/src/routes/members.ts:40-43).
See ../gotchas.md for the `is_active` column's actual (non-)behavior.
