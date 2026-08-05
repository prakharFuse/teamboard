---
name: data-model
description: The members table schema — the only table in TeamBoard's SQLite DB
type: knowledge
scope: global
updated: 2026-08-05 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
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

Single table, created inline in `getDb()` (`server/src/db.ts:18-30`) — there is
no migrations directory or schema file elsewhere; this function body is the
schema of record.

- `email` has a `UNIQUE` constraint; `members.ts` POST handler catches the
  resulting SQLite error by string-matching `'UNIQUE'` in the message and maps
  it to a `409`.
- `department` has **no** constraint (no enum, no FK to a departments table)
  — any string is accepted at the DB layer. See [[gotchas]] (TM-105) for why
  this matters.
- `is_active` defaults to `1` and nothing in the current code path ever sets
  it to `0`: `DELETE /api/members/:id` issues a real `DELETE FROM members`,
  not a soft-delete update. See [[gotchas]].
- Seed data (8 rows) is inserted once, only when the table is empty, in the
  same function — there's no separate seed script.
