---
name: data-model
description: TeamBoard SQLite schema (single members table) — read before adding fields or queries
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
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

Single-table schema, created inline in `getDb()` (server/src/db.ts:18-30) — no migrations directory or ORM. `email` has a `UNIQUE` constraint enforced at insert time in `POST /api/members` (server/src/routes/members.ts:39-43, caught and returned as 409). See [[overview]] for the caveat that `is_active` is never set to 0 by any current code path.
