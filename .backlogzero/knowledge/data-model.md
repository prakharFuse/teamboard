---
name: data-model
description: The members table schema and the is_active/DELETE divergence — read before adding fields or changing removal behavior
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 75706bc42081782421d5e7c783f52bc2ae0b0931
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 5ad470f2eac50a7fec73d2ddf95842dd87f2d33de9a8d4d1c4e55ba242d2a3a2
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
        integer is_active
        text created_at
        text updated_at
    }
```

Single table, defined inline in `server/src/db.ts:18-30` (no migration files, no ORM — see [[overview]]).

- `email` has a `UNIQUE` constraint; `POST /api/members` catches the SQLite unique-violation and turns it into a `409` (`server/src/routes/members.ts:53-56`) rather than letting the raw DB error surface.
- **`is_active` is written once, at insert time (`DEFAULT 1`), and never updated afterward.** `DELETE /api/members/:id` (`server/src/routes/members.ts:124-135`) hard-deletes the row rather than setting `is_active = 0`, and `PATCH /api/members/:id` (`server/src/routes/members.ts:97-122`) doesn't touch `is_active` either. The column exists and `GET /api/members` filters on it (`WHERE is_active = 1`), but nothing in the codebase ever produces an inactive-but-present row — so that filter is currently a no-op over the live data. Anyone adding a "deactivate" or "soft delete" feature should reuse this existing column rather than adding a new one.
- `department` has no DB-level `CHECK` constraint or enum, but is now validated in the app layer: `POST`/`PATCH` reject any value not in `VALID_DEPARTMENTS` (`server/src/routes/members.ts:16-24,42-45,107-110`) with a `400` — see [[gotchas]] for the now-resolved TM-105 history.
