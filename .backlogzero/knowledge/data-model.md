---
name: data-model
description: The members table schema — read before adding fields or queries
type: knowledge
scope: global
updated: '2026-09-01'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
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

- `email` has a `UNIQUE` constraint — `POST /api/members` catches the
  resulting SQLite error by matching `err.message.includes('UNIQUE')` and
  returns 409 (`server/src/routes/members.ts:39-44`). Any other DB error is
  rethrown, so it isn't silently swallowed.
- `department` has **no** constraint or enum at the DB or route level —
  `POST`/`PATCH` accept any string. See
  [[gotchas]] for why this is a live, intentionally-tracked gap rather than
  an oversight.
- `is_active` is an integer flag, not a boolean column type (SQLite has no
  native boolean) — `GET /api/members` filters `WHERE is_active = 1`;
  `DELETE /api/members/:id` does a hard `DELETE`, not a soft-delete flip of
  `is_active` — despite the column existing for that purpose, nothing in the
  current routes ever sets it to `0`.
