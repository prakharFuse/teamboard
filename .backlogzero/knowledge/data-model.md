---
name: data-model
description: The members SQLite schema — single-table entity, fields, and constraints
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

Single-table schema, created inline in `getDb()` (no migration files):

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

- `email` has a `UNIQUE` constraint; `POST /api/members` catches the resulting
  SQLite error and turns it into a 409 (see `members.ts`).
- `department` is a free-text column with no enum/lookup table or CHECK
  constraint — any string is accepted by the schema itself. See [[gotchas]]
  for the in-flight validation gap at the API layer.
- `is_active` defaults to `1` and is used to filter `GET /api/members`, but
  no route ever sets it to `0` — see [[gotchas]] for why DELETE doesn't use it.
- Seed data (8 members) is inserted only when the table is empty, in
  `server/src/db.ts`.
