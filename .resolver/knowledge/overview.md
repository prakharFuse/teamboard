---
name: overview
description: What TeamBoard is and where things live — read first for orientation
type: knowledge
scope: global
updated: '2026-08-13'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - CLAUDE.md
  - README.md
---

TeamBoard is an internal team-directory app: Express + SQLite API in `server/`, a Vite/React client in `client/`. See `../../CLAUDE.md` and `../../README.md` for the endpoint list, scripts, and layout — those are accurate and don't need repeating here.

## Gaps not covered by CLAUDE.md / README

- **Department validation is an open ticket (TM-105), not yet implemented.** `POST /api/members` in `server/src/routes/members.ts` accepts any non-empty `department` string and inserts it as-is — there is no allow-list or enum check. The CI-run test `server/src/routes/members.test.ts` ("rejects an invalid department with 400") is intentionally RED on `main` today; see `../../.github/workflows/ci.yml` for the note. Anyone picking up TM-105 needs to add the validation in the POST handler (and decide whether PATCH should validate too — it currently doesn't).
- **Seed data already has inconsistent department names.** `server/src/db.ts` seeds `department` as `'Engineering'` for Alice Chen but `'Eng'` for David Kim and Hiro Tanaka. Whatever canonical department list TM-105 introduces must account for this — either normalize the seed rows or include both spellings, otherwise existing seeded members would fail re-validation on PATCH.
- **DELETE is a hard delete, not a soft delete**, despite the schema having an `is_active` column (`server/src/db.ts` table def) that `GET /api/members` filters on. `DELETE /api/members/:id` in `members.ts` runs `DELETE FROM members WHERE id = ?` — it removes the row entirely rather than flipping `is_active` to 0. There is currently no code path that ever sets `is_active = 0`.
- **No request-schema library.** Validation in `members.ts` is manual (`if (!name || !email || ...)` truthy checks) — no zod/joi/etc. New validation (e.g. for TM-105) should follow this same manual-check style unless the team explicitly adopts a schema library.

## Do not modify without reason

- `server/src/db.ts` seed data — tests and manual QA assume 8 seeded rows across specific departments (see `../../.github/workflows/ci.yml` and `members.test.ts`).
