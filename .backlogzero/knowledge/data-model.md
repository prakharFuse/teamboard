---
name: data-model
description: The members table schema and lifecycle — read before touching db.ts or members.ts
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

Single table, created via inline `CREATE TABLE IF NOT EXISTS` in `getDb()` (`server/src/db.ts:18-30`) — there is no migrations directory or ORM; schema changes mean editing this DDL string directly. `email` is the only unique constraint; the `POST /` handler in `members.ts:39-42` relies on catching a SQLite `UNIQUE` error message substring to return 409, rather than a pre-check query.

`department` is a free-text column with **no validation or enum constraint** at the DB or API layer — see `../conventions/testing.md` for the CI test that documents this as an open gap (TM-105).

Seed data (8 members, `db.ts:37-44`) is inserted only when the table is empty, on every fresh `data/team.db` or `:memory:` DB.
