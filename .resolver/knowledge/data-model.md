---
name: data-model
description: The members table schema (single-table SQLite DB) — read before adding fields or queries
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
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

One table, created with `CREATE TABLE IF NOT EXISTS` and seeded with 8 rows
the first time `getDb()` runs against an empty database
(`server/src/db.ts:18-45`). `email` has a `UNIQUE` constraint — inserts that
violate it must be caught and turned into a 409 (see the `try/catch` in
`POST /api/members`, `server/src/routes/members.ts:33-45`, as the pattern to
follow for any new unique-constrained insert).

`department` and `role` are free-text columns with no `CHECK` constraint or
foreign key to a lookup table — see [[gotchas]] for why that matters for
`POST`/`PATCH`.
