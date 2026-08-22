---
name: data-model
description: The single `members` SQLite table and its column-level constraints
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

One table, no foreign keys or joins anywhere in the codebase.

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

- `email` is the only unique constraint; `POST /api/members` relies on the SQLite `UNIQUE`
  error to return 409 (see [[gotchas]] for the fragility of that check).
- `department` is a plain `TEXT` column with no `CHECK` constraint or enum — anything can be
  inserted today (see [[gotchas]] for why that matters).
- `is_active` is an integer flag (0/1), not a boolean column type — `node:sqlite` has no native
  boolean, so callers must treat it as `number` (see `MemberRow.is_active: number` in
  `server/src/routes/members.ts`).
