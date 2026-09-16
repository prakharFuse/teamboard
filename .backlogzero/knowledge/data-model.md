---
name: data-model
description: The members table schema (only table in the DB)
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
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

- Single table, defined inline in `getDb()` (`server/src/db.ts:19-30`) — no migrations directory, no ORM.
- `email` has a `UNIQUE` constraint; `server/src/routes/members.ts:40-43` catches the resulting SQLite error and turns it into a 409.
- `department` is a free-text column with **no enum/allowlist anywhere in the code**. The seed data itself is inconsistent: Alice Chen is seeded into `"Engineering"` while David Kim and Hiro Tanaka are seeded into `"Eng"` (`server/src/db.ts:37-44`) — two different strings for what's presumably the same department. Anything that groups or filters by department (e.g. the `/stats` endpoint) will treat these as distinct departments.
- `is_active` is an `INTEGER` (0/1) flag; `DELETE /api/members/:id` does a hard delete (`members.ts:106-117`), it does not set `is_active = 0` — there is currently no code path that ever sets `is_active` to anything other than its default of `1`.
