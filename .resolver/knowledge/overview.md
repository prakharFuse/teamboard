---
name: overview
description: Read first — TeamBoard's shape, and gaps CLAUDE.md/README don't cover
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - CLAUDE.md
  - README.md
  - package.json
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
---

For project layout, commands, and the endpoint list, see [CLAUDE.md](../../CLAUDE.md) and [README.md](../../README.md) — both are accurate as of this snapshot.

## Known-red CI check (do not "fix" by weakening the test)

`server/src/routes/members.test.ts` has a test — `POST /api/members rejects an invalid department with 400` — that is **intentionally failing on `main`**. `POST /api/members` (`server/src/routes/members.ts:26-46`) performs no validation on `department`; it inserts whatever string the caller sends. The test file and `.github/workflows/ci.yml` both document this as tracking ticket TM-105. If you land department validation, this test should turn green as a side effect — don't special-case it or delete it to make CI pass.

## `is_active` exists but nothing ever sets it to 0

`server/src/db.ts:26` defines `is_active INTEGER NOT NULL DEFAULT 1`, and `GET /api/members` filters on `is_active = 1`. But `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`) does a hard `DELETE FROM members`, and `PATCH /api/members/:id` (`members.ts:83-104`) never touches `is_active`. There is currently no code path that soft-deactivates a member — the column is write-once (seed data only). Neither CLAUDE.md nor README claim soft-delete behavior, so this isn't a contradiction of those docs, but assume hard-delete semantics until a route is added.

## PATCH only covers four fields

`PATCH /api/members/:id` updates `name`, `email`, `role`, `department` via `COALESCE` — it silently ignores `start_date` and `is_active` even if sent in the request body (`members.ts:92-101`).
