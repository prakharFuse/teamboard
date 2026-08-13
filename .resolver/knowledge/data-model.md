---
name: data-model
description: The members table schema, constraints, and what's inconsistent in seed data
type: knowledge
scope: global
updated: '2026-08-13'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
---

Single-table schema, created via `CREATE TABLE IF NOT EXISTS` in `getDb()`:

```mermaid
erDiagram
  MEMBERS {
    INTEGER id PK "AUTOINCREMENT"
    TEXT name "NOT NULL"
    TEXT email "NOT NULL, UNIQUE"
    TEXT role "NOT NULL"
    TEXT department "NOT NULL, no enum/check constraint"
    TEXT start_date "NOT NULL, stored as string e.g. 2022-03-15"
    INTEGER is_active "NOT NULL DEFAULT 1"
    TEXT created_at "NOT NULL DEFAULT datetime('now')"
    TEXT updated_at "NOT NULL DEFAULT datetime('now'), not auto-updated by SQLite — app must set it"
  }
```

Notes derived from the code (not stated in CLAUDE.md/README):

- `department` has no `CHECK` constraint or foreign key to a departments table — it's a free-text column. This is why `POST /api/members` currently accepts any string (see `[[overview]]` for the TM-105 gap).
- `updated_at`'s default only fires on `INSERT`; the `PATCH` handler in `members.ts` explicitly sets `updated_at = datetime('now')` in its `UPDATE` statement — if any future write path forgets this, `updated_at` will go stale silently (SQLite won't update it automatically).
- `email` is the only unique constraint; `POST` relies on catching the SQLite `UNIQUE` constraint violation by string-matching `err.message.includes('UNIQUE')` (see `members.ts` POST handler) rather than a pre-check query.
