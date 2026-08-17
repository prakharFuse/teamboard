---
name: data-model
description: Schema of the single `members` SQLite table (read before changing db.ts or members.ts)
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

One table, created inline in `getDb()` (server/src/db.ts:18-30) — there is no separate migrations folder or ORM. `email` has a `UNIQUE` constraint that `POST /api/members` surfaces as a 409 (server/src/routes/members.ts:39-43). `is_active` defaults to 1 and is what `GET /api/members` filters on, but see ../gotchas.md — `DELETE` does not use this flag.
