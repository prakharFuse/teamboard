---
name: data-model
description: The members table schema, its one gotcha column, and what's not enforced
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Single-table schema, created inline via `CREATE TABLE IF NOT EXISTS` in `server/src/db.ts:18-30`
(no migrations directory — the DDL in `db.ts` is the only source of truth).

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

- `email` has a `UNIQUE` constraint; `POST /api/members` catches the resulting SQLite error and
  maps it to `409` (`server/src/routes/members.ts:39-44`) — the only constraint-violation handling
  in the router.
- `department` and `start_date` are free-text `NOT NULL` columns with no format or allow-list
  check at the DB or route layer — see `[[overview]]` for the resulting seed-data inconsistency
  (`'Engineering'` vs `'Eng'`).
- `is_active` defaults to `1` and is read by `GET /api/members` and `GET /api/members/stats`, but
  no code path ever writes `0` to it — `DELETE` is a hard delete, not a deactivate. Don't build
  features (e.g. "restore a removed member") on the assumption that soft-delete exists.
