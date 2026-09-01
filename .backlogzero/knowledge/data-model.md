---
name: data-model
description: The members table schema — read before adding fields or queries
type: knowledge
scope: global
updated: 2026-09-01 (IONE-959)
captured_sha: 0b416e84bdcfdfbbae5c54f529d804b02e25baf8
sources:
  - server/src/routes/members.ts
sources_sha256:
  server/src/routes/members.ts: 73223ab7cde69649343562263ce219e9903fa0d47c8c400551df3a42a07c5d1a
---

Single-table schema, defined inline in `getDb()` (no migration files exist —
this DDL runs every time the DB file/connection doesn't already have the
table).

```mermaid
erDiagram
    MEMBERS {
        integer id PK "AUTOINCREMENT"
        text name
        text email "UNIQUE"
        text role
        text department
        text start_date
        integer is_active "default 1"
        text created_at "default datetime('now')"
        text updated_at "default datetime('now')"
    }
```

- `email` has a `UNIQUE` constraint — both `POST /api/members`
  (`server/src/routes/members.ts:33-45`) and `PATCH /api/members/:id`
  (`server/src/routes/members.ts:93-111`) catch the resulting SQLite error by
  matching `err.message.includes('UNIQUE')` and return 409. Any other DB
  error is rethrown, so it isn't silently swallowed. See [[gotchas]] — the
  `PATCH` route didn't always have this catch.
- `department` has **no** constraint or enum at the DB or route level —
  `POST`/`PATCH` accept any string. See
  [[gotchas]] for why this is a live, intentionally-tracked gap rather than
  an oversight.
- `is_active` is an integer flag, not a boolean column type (SQLite has no
  native boolean) — `GET /api/members` filters `WHERE is_active = 1`;
  `DELETE /api/members/:id` does a hard `DELETE`, not a soft-delete flip of
  `is_active` — despite the column existing for that purpose, nothing in the
  current routes ever sets it to `0`.
