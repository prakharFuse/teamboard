---
name: data-model
description: The members table schema — read before adding fields, migrations, or new queries
type: knowledge
scope: global
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

Single-table schema, created inline in `getDb()` (`server/src/db.ts:18-30`) — there is no migration system, so schema changes mean editing that `CREATE TABLE IF NOT EXISTS` string directly (existing `data/team.db` files won't pick up the change without deleting the file, since `IF NOT EXISTS` is a no-op on an already-created table).

```mermaid
erDiagram
  MEMBERS {
    integer id PK "AUTOINCREMENT"
    string name
    string email UK "UNIQUE, not case-normalized"
    string role
    string department "free text — no enum/check constraint"
    string start_date "stored as TEXT, not a DATE type"
    integer is_active "0/1, default 1 — soft-delete flag"
    string created_at "TEXT, default datetime('now')"
    string updated_at "TEXT, default datetime('now')"
  }
```

- `department` is an unconstrained `TEXT` column — the DB layer places no restriction on values. See [[gotchas]] for the app-layer implication.
- `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) does a real SQL `DELETE`, not a soft-delete via `is_active` — despite `is_active` existing and being used to filter `GET /api/members` and `/stats`. There's no route that flips `is_active` to 0.
