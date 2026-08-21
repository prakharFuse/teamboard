---
name: data-model
description: The members table schema — single-table SQLite model, no migrations
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

Single table, no foreign keys, no separate `departments`/`roles` tables — `department` and `role` are free-text columns on `members`, not enums or lookups (server/src/db.ts:19-29). The schema is created inline via `CREATE TABLE IF NOT EXISTS` in `getDb()`; there is no migrations directory or migration tool. Seed data (same file, run once when the table is empty) itself uses inconsistent department spellings — `'Engineering'` for one member and `'Eng'` for two others (server/src/db.ts:40,44) — so any department validation/normalization work must decide how to reconcile existing rows, not just gate new ones.
