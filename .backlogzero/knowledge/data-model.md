---
name: data-model
description: members table schema, seed data, and constraints
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Single-table schema, created via `db.exec(CREATE TABLE IF NOT EXISTS ...)` in `getDb()` — there is no migrations directory or ORM.

```mermaid
erDiagram
    MEMBERS {
        int id PK
        text name
        text email UK
        text role
        text department
        text start_date
        int is_active
        text created_at
        text updated_at
    }
```

- `email` has a `UNIQUE` constraint enforced at the SQLite level, not in application code. `POST /` catches the resulting error and maps it to `409` (`members.ts:39-44`); `PATCH /:id` does **not** catch this — updating a member's email to one already in use throws uncaught inside the handler (see [[gotchas]]).
- `department` has no allow-list or enum, at the DB or app level — any string is accepted on insert. Seed data uses inconsistent values for the same team (`'Engineering'` vs `'Eng'` for two different engineers in `db.ts:37-44`), which is intentional test fixture noise, not a bug to "fix" incidentally.
- `is_active` defaults to `1` on insert and is never set to `0` anywhere in the codebase — see [[gotchas]] for why this means `DELETE` is a hard delete, not a soft one.
- `start_date` is stored as free-text (whatever the client sends, e.g. `'2022-03-15'`) — there's no date type or validation.
