---
name: data-model
description: The members table schema — read before adding fields, migrations, or queries
type: knowledge
scope: global
updated: '2026-08-04'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/src/db.ts
---

Single table, created inline in `getDb()` (`server/src/db.ts:18-30`) — there is
no migration framework or separate schema file.

```mermaid
erDiagram
  members {
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

- `email` has a `UNIQUE` constraint; `POST /api/members` catches the resulting
  SQLite error by matching `err.message.includes('UNIQUE')` and returns 409
  (`server/src/routes/members.ts:39-44`) — there's no pre-check query, so any
  other constraint violation would fall through and throw unhandled.
- `department` is a free-text column with no `CHECK` constraint, enum, or
  lookup table — see [[gotchas]] for why that matters.
- Seed rows (`server/src/db.ts:37-44`) only insert once, guarded by
  `COUNT(*) = 0`, so schema/seed changes to `getDb()` won't apply to an
  existing `data/team.db` file — delete it to re-seed locally.
