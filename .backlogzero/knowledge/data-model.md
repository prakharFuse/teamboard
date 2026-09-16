---
name: data-model
description: The members table schema — read before writing queries or migrations
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

There is a single table, created inline in `getDb()` (`server/src/db.ts:18-30`) — no migration framework, no separate schema files.

```mermaid
erDiagram
  MEMBERS {
    integer id PK
    text name
    text email UK
    text role
    text department
    text start_date
    integer is_active
    text created_at
    text updated_at
  }
```

- No foreign keys or related tables exist — `department` is a free-text column, not a lookup table (see the TM-105 note in [[gotchas]]).
- `is_active` is a soft-delete flag but `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) does a hard `DELETE FROM members`, not a soft-delete via `is_active = 0` — the flag is only ever set at insert time (defaults to `1`) and is never flipped to `0` anywhere in the codebase.
- `email` is the only unique constraint; `name` can collide.
