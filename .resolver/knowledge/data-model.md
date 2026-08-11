---
name: data-model
description: The single members table schema, read before adding columns or migrations
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

- One table, no foreign keys, no migrations framework — the schema is a single `CREATE TABLE IF NOT EXISTS` in `server/src/db.ts:18-30`, applied every time `getDb()` runs. Any schema change means editing that inline `CREATE TABLE` and it will only apply to fresh databases (existing `data/team.db` files won't get new columns — there's no `ALTER TABLE` or migration step).
- `email` has a `UNIQUE` constraint; `members.ts:40` catches the resulting SQLite error by matching the string `'UNIQUE'` in `err.message` and turns it into a 409. There's no separate pre-check query.
- `is_active` defaults to `1` and is used to filter `GET /` and `/stats`, but nothing in the codebase ever sets it to `0` — see [gotchas.md](gotchas.md) for the delete-semantics divergence this implies.
