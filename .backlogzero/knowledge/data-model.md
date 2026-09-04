---
name: data-model
description: The members table schema (only table in TeamBoard) and its constraints
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: dfe21663ab090db7106672a2c13587b1d8bc3bf8
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
sources_sha256:
  server/src/routes/members.test.ts: 8551b4b44e247d3e1e12ae34b2181fbe9034b0f26f19b3e8e070de379f106439
  server/src/routes/members.ts: 504a36017aee306678043eb944dc8b9c82dc3e352707c14468f464e82678a2f1
---

Single-table schema, defined inline as DDL in `getDb()` (`server/src/db.ts:18-30`) — no migrations directory, no ORM, no separate schema file.

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

- `email` is the only unique constraint; `POST /api/members` catches the resulting SQLite error by string-matching `'UNIQUE'` in the message (`server/src/routes/members.ts:40`) rather than a typed error code — fragile if the DB driver's error message format changes.
- `department` has no constraint, enum, or lookup table anywhere in the code. Seed data (`server/src/db.ts:37-44`) is itself inconsistent: Alice Chen is seeded as `'Engineering'` while David Kim and Hiro Tanaka are seeded as `'Eng'` — two spellings for the same department already exist in the "canonical" seed rows. Anyone adding department validation needs to pick/normalize a canonical list first; don't assume the seed data is the source of truth as-is. See [[gotchas]].
- `is_active` is a soft-delete flag (0/1). `DELETE /:id` (`server/src/routes/members.ts:106-119`) sets `is_active = 0` and `updated_at`, leaving the row in place — it does not remove the record. The row is excluded from `GET /` (which filters `is_active = 1`) but still appears in `GET /export` and remains fetchable via `GET /:id`.
