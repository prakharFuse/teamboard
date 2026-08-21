---
name: data-model
description: The members table schema and constraints — read before adding fields or queries
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

Single-table schema, created inline in `getDb()` (no migration files or ORM):

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

- `email` has a `UNIQUE` constraint; `POST /api/members` catches the resulting
  SQLite error and turns it into a 409 (`members.ts` — matches on
  `err.message.includes('UNIQUE')`, so any UNIQUE-constraint violation on this
  table maps to that same "email already exists" message).
- `department` is a free-text column with **no allowlist or enum anywhere in
  the code** — see [[gotchas]] for why this matters (TM-105) and for the
  inconsistent seed values (`Engineering` vs `Eng`).
- `is_active` exists but `DELETE /api/members/:id` performs a hard
  `DELETE FROM members`, not a soft-delete via `is_active = 0` — see
  [[gotchas]].
