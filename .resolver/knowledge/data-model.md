---
name: data-model
description: The single `members` table schema and its unenforced invariants (department, is_active, seed data)
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

One table, created inline by `getDb()` (no migration files, no ORM):

```mermaid
erDiagram
  members {
    INTEGER id PK "AUTOINCREMENT"
    TEXT name
    TEXT email "UNIQUE, NOT NULL"
    TEXT role
    TEXT department "no FK/enum — free text today"
    TEXT start_date "stored as plain TEXT, not a DATE type"
    INTEGER is_active "0 or 1, default 1"
    TEXT created_at "default datetime('now')"
    TEXT updated_at "set on PATCH only"
  }
```

`is_active` looks like a soft-delete flag (`GET /api/members` and `GET /api/members/stats` both filter `WHERE is_active = 1`), but nothing in the API ever writes `0` to it — `DELETE /api/members/:id` (`server/src/routes/members.ts:106`) does a real `DELETE FROM members`, not a soft-delete update. Every row that exists has `is_active = 1` in practice; the column and its read-side filters are currently dead weight rather than a working soft-delete feature.

`department` has no FK, enum, or CHECK constraint — see `../overview.md` for the related TM-105 validation gap and the inconsistent seed values (`'Engineering'` vs `'Eng'`).
