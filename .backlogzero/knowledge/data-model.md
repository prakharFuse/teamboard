---
name: data-model
description: The `members` table schema — read before writing any new query or migration
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

Single-table schema, created inline in `getDb()` (no migration framework — schema changes mean editing the `CREATE TABLE IF NOT EXISTS` in `server/src/db.ts` directly, which only takes effect on a fresh DB file since it's `IF NOT EXISTS`).

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

- `email` has a `UNIQUE` constraint; `POST /api/members` relies on catching the SQLite unique-violation error message (substring match on `'UNIQUE'`) to return `409` (`server/src/routes/members.ts:39-44`) rather than a pre-check query.
- `department` and `start_date` are free-text `TEXT`, no enum/check constraint at the DB level — see `[[gotchas]]` for the seed-data inconsistency this causes.
- `is_active` defaults to `1` and is the only active/inactive marker, but see `[[gotchas]]` — nothing in the codebase ever sets it to `0`.
