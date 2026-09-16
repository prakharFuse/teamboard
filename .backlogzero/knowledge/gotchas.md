---
name: gotchas
description: Non-obvious behaviors and a known intentionally-failing test — read before touching members.ts or the delete/status flow
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/src/routes/members.test.ts
sources_sha256:
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## DELETE hard-deletes rows; `is_active` is never toggled off

The `members` table has an `is_active` column (`server/src/db.ts:26`) and `GET /api/members` filters on it, which implies a soft-delete model. In reality `DELETE /api/members/:id` runs `DELETE FROM members WHERE id = ?` (`server/src/routes/members.ts:115`) — a permanent hard delete. No route anywhere sets `is_active = 0`. If a future change wants to "deactivate" rather than remove a member, that's new functionality, not a rename of existing behavior.

The client's "Remove" button (`client/src/App.tsx:69`) calls this DELETE endpoint directly with only a `confirm()` dialog — there's no undo path.

## Seed data has an inconsistent department name

`server/src/db.ts` seeds two members under `'Eng'` (David Kim, Hiro Tanaka) and others under `'Engineering'` (Alice Chen). Since `department` is free-text with no enum, `GET /api/members/stats`'s `GROUP BY department` reports these as two separate departments. Any department-validation work should decide the canonical set of department names up front — the existing seed data is not a reliable source of truth for that set.

## A CI test is intentionally red on `main`

`server/src/routes/members.test.ts` contains a test, `'POST /api/members rejects an invalid department with 400'`, that is deliberately failing today (per the file's own header comment, tracked as TM-105): `POST /api/members` currently accepts any `department` string and returns `201` — there is no allow-list/validation. This is a known, intentional state (used to exercise the Fix-CI/Refine-PR flow), not a regression to silently "fix" by weakening the test — implementing real department validation in `members.ts` is the expected resolution.
