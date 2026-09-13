---
name: data-model
description: TeamBoard's single `members` table schema and field semantics
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/db.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
---

```mermaid
erDiagram
    MEMBERS {
        integer id PK
        text name
        text email UK
        text role
        text department
        text start_date
        integer is_active "default 1"
        text created_at "default now()"
        text updated_at "default now()"
    }
```

Single-table schema, created on first `getDb()` call if missing
(`server/src/db.ts:18-30`), then seeded with 8 rows if empty. No migrations
directory — schema changes must edit the inline `CREATE TABLE IF NOT EXISTS`
DDL directly, and existing `data/team.db` files won't pick up column changes
automatically (the guard is `IF NOT EXISTS`, not a migration runner).

`is_active` exists in the schema and is read by `GET /api/members` (filters
`WHERE is_active = 1`) and `GET /api/members/stats`, but nothing in
`routes/members.ts` ever sets it to `0` — see [[gotchas]] for why `DELETE`
does not use it.
