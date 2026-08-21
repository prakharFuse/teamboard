---
name: data-model
description: The single `members` table schema and its constraints
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
    text email UK "UNIQUE"
    text role
    text department
    text start_date
    integer is_active "default 1"
    text created_at "default now"
    text updated_at "default now"
  }
```

One table, no foreign keys. `email` is the only unique constraint (violating it surfaces as a SQLite `UNIQUE` error, which `POST /api/members` in `server/src/routes/members.ts` catches by string-matching `err.message.includes('UNIQUE')` and turns into a 409).

`department` and `role` are free-text columns with no enum/check constraint at the DB level — nothing in the schema restricts which department strings are valid (see `.resolver/knowledge/gotchas.md` for why that matters).
