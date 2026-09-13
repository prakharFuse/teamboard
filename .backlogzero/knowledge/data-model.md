---
name: data-model
description: The members table schema and its quirks
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

Single-table schema, defined inline in `getDb()` — no migration files, no ORM.

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

- `email` has a `UNIQUE` constraint; `POST /api/members` catches the
  resulting SQLite error by string-matching `err.message.includes('UNIQUE')`
  and turns it into a 409 (`server/src/routes/members.ts:40`) — there's no
  structured SQLite error code check, so any other constraint violation
  would fall through as an unhandled 500.
- `department` is a free-text column with **no validation or enum** anywhere
  in the stack (client form, `POST`, or `PATCH`) — see [[gotchas]] for why
  the seed data itself already has inconsistent department names.
- `is_active` is an integer flag (soft delete), but `DELETE
  /api/members/:id` (`server/src/routes/members.ts:115`) does a hard
  `DELETE FROM members`, not a soft-delete update — the flag is written by
  nothing except the column default (`1`).
