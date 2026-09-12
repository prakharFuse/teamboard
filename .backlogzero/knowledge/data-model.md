---
name: data-model
description: The members table schema and its quirks — read before writing migrations, queries, or department validation
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
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

Single table, no foreign keys, no migrations framework — schema is a `CREATE
TABLE IF NOT EXISTS` inlined in `getDb()` (`db.ts:18-30`). `department` is a
free-text column with no `CHECK` constraint or enum anywhere in the schema or
route code: `POST`/`PATCH` insert or update whatever string is sent
(`members.ts:35-36`, `members.ts:92-101`).

The seed data itself is inconsistent about department naming — `'Engineering'`
(Alice) vs `'Eng'` (David, Hiro) at `db.ts:37-44` — so `/api/members/stats`
groups these as two separate departments today. Anyone adding department
validation should decide up front which spelling is canonical, since existing
seed rows use both.
