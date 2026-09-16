---
name: data-model
description: The members table schema (only table in the DB)
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 90b4e52c842667da0da95f034cf73a2c51089aee
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 5c963eb268abb53a32841c254096a8ec421692e72d0a5a780b1b07b67364666c
  server/src/routes/members.ts: 9ce9d96e34012c4b3799983e87e08ca6b5b0b5429ff1ddad2bdb9d0de75a9fb5
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

- Single table, defined inline in `getDb()` (`server/src/db.ts:19-30`) — no migrations directory, no ORM.
- `email` has a `UNIQUE` constraint; `server/src/routes/members.ts` catches the resulting SQLite error and turns it into a 409 on both the `POST` insert and the soft-delete `UPDATE` (which prefixes email with `deactivated-`).
- `department` is `TEXT NOT NULL` with no DB-level CHECK/enum, but `members.ts` enforces a `CANONICAL_DEPARTMENTS` allowlist (Engineering, Product, Design, Marketing, Sales, Operations, Finance, HR, Legal) at the application layer on `POST` and `PATCH` — validation lives in the route, not the schema. All seed rows (`server/src/db.ts:37-44`) use canonical values.
- `is_active` is an `INTEGER` (0/1) flag. `DELETE /api/members/:id` is a soft delete: it sets `is_active = 0` and prefixes `email` with `deactivated-` rather than removing the row (`members.ts:174-180`). `GET /` and `/stats` filter to `is_active = 1`; `/export` does not, so deactivated members still appear there.
