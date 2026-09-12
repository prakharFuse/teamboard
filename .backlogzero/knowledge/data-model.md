---
name: data-model
description: The single `members` SQLite table — schema, seed data, and known data-quality quirks
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

The schema lives as inline DDL in `server/src/db.ts` (`CREATE TABLE IF NOT EXISTS members ...`) — there is no separate migrations directory or ORM model file.

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

- `email` has a `UNIQUE` constraint; `server/src/routes/members.ts` catches the resulting SQLite error message (`includes('UNIQUE')`) and turns it into a 409 — there's no pre-check query.
- `department` is a free-text column with **no enum/check constraint or app-level validation** on insert or update. The seed data itself is inconsistent: two rows use `"Eng"` (David Kim, Hiro Tanaka) while the rest use the full `"Engineering"` — so `/api/members/stats` currently reports `Eng` and `Engineering` as separate departments. See [[gotchas]] for why this matters for any validation work.
- `is_active` is an `INTEGER` flag (soft-delete style), but `DELETE /api/members/:id` in `members.ts` does a real `DELETE FROM members`, not a soft-delete update — `is_active` is set on insert (default `1`) and never toggled anywhere in the current code.
