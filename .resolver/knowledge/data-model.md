---
name: data-model
description: The members table schema — read before touching db.ts or writing queries/migrations
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

Single-table schema, created inline in `getDb()` (no migration files — the
`CREATE TABLE IF NOT EXISTS` in `db.ts` *is* the schema).

```mermaid
erDiagram
  MEMBERS {
    integer id PK "AUTOINCREMENT"
    text name
    text email UK
    text role
    text department
    text start_date "ISO date string, not a SQL date type"
    integer is_active "0/1, default 1"
    text created_at "datetime('now') default"
    text updated_at "datetime('now') default, but only POST/db.ts set it — PATCH does update it"
  }
```

`email` is the only unique constraint; `department` is a free-text column with
no allowlist/enum at the DB level (see `gotchas.md` for the validation gap and
the inconsistent seed values this leads to).
