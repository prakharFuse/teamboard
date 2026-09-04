---
name: data-model
description: The members table schema and the fields the API actually lets you touch
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Single-table schema, defined inline as DDL in `server/src/db.ts` (`CREATE TABLE IF NOT EXISTS members ...`) — there is no separate migrations directory or schema file.

```mermaid
erDiagram
  MEMBERS {
    integer id PK
    text name
    text email "UNIQUE"
    text role
    text department
    text start_date
    integer is_active "default 1"
    text created_at
    text updated_at
  }
```

## Column write-paths (derived from `server/src/routes/members.ts`)

- `POST /api/members` — sets `name`, `email`, `role`, `department`, `start_date`. Requires all five as truthy or 400s.
- `PATCH /api/members/:id` — only updates `name`, `email`, `role`, `department` (via `COALESCE`) plus `updated_at`. **`start_date` and `is_active` are not writable through any route.**
- `DELETE /api/members/:id` — hard `DELETE FROM members`, not a soft-delete. `is_active` is never set to `0` anywhere in the codebase; it exists only as a column that's always `1` and is used purely as a read-side filter (`WHERE is_active = 1`) on `GET /api/members` and `/api/members/stats`. See [[gotchas]].
