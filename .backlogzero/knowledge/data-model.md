---
name: data-model
description: The single `members` SQLite table and its columns/constraints
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

```mermaid
erDiagram
    MEMBERS {
        INTEGER id PK "AUTOINCREMENT"
        TEXT name
        TEXT email UK "UNIQUE"
        TEXT role
        TEXT department
        TEXT start_date
        INTEGER is_active "DEFAULT 1"
        TEXT created_at "DEFAULT datetime('now')"
        TEXT updated_at "DEFAULT datetime('now')"
    }
```

Single-table schema, created inline in `getDb()` (`server/src/db.ts:18-30`) with `CREATE TABLE IF NOT EXISTS` — there are no separate migration files. `email` has a `UNIQUE` constraint; `POST /api/members` relies on the resulting SQLite error (matched by string `'UNIQUE'`) to return 409 rather than pre-checking (`server/src/routes/members.ts:39-43`).

See [[gotchas]] for the `is_active` column behavior, which diverges from what its presence implies.
