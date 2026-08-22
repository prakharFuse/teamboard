---
name: data-model
description: The members table schema and its constraints — read before writing SQL or migrations
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
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

Single table, no foreign keys, created inline in `getDb()` (`server/src/db.ts:18-30`) rather than via a migration file — there is no migrations directory in this repo.

- `email` has a `UNIQUE` constraint enforced at the DB level; violating it surfaces as a generic `Error` that `members.ts` matches by substring (see [[backend-patterns]]).
- `department` is a free-text column with no `CHECK` constraint or reference table, despite the UI presenting it as a fixed field — see [[gotchas]].
- `is_active` defaults to `1` and is never set to `0` anywhere in the codebase today (`DELETE` removes rows outright) — see [[gotchas]].
