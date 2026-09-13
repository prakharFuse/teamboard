---
name: data-model
description: The members table schema — single-entity SQLite schema defined inline in db.ts
type: knowledge
scope: global
updated: '2026-09-13'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

The schema is not a Prisma/migration file — it's a single inline `CREATE TABLE IF NOT EXISTS` in `server/src/db.ts:19-29`, run every time `getDb()` first initializes the connection.

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

- `email` has a `UNIQUE` constraint; `server/src/routes/members.ts:39-43` catches the resulting SQLite error by matching the string `'UNIQUE'` in `err.message` and turns it into a `409`. There's no separate email-format validation.
- `department` is a free-text column with **no enum/check constraint** — any string is accepted at the DB layer. See [[gotchas]] for why this matters (TM-105).
- `is_active` is an `INTEGER` (0/1) flag, not a real boolean column — `node:sqlite` has no boolean type, so comparisons/filters use `= 1`.
- `start_date` is stored as free-text (`'YYYY-MM-DD'` in seed data), not a SQLite date type.
